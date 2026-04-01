import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { config } from './config';
import { DownloadFileRequest } from './types/download';
import { isAuthorized } from './utils/auth';
import { normalizeTargetFolder, validateRequestBody } from './utils/validation';
import { processDownload } from './services/download-service';

const fastify = Fastify({
  logger: true,
});

const API_PREFIX = '/downloader_service';

fastify.get(`${API_PREFIX}/health`, async () => {
  return { status: 'ok' };
});

fastify.get(`${API_PREFIX}/config`, async (request, reply) => {
  if (!isAuthorized(request)) {
    return reply.code(401).send({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  }

  return {
    server: config.server,
    download: config.download,
    security: {
      apiKeyConfigured: Boolean(config.security.apiKey),
    },
  };
});

fastify.post(
  `${API_PREFIX}/api/downloads`,
  async (
    requestFastify: FastifyRequest<{ Body: DownloadFileRequest }>,
    reply: FastifyReply
  ) => {
    try {
      if (!isAuthorized(requestFastify)) {
        return reply.code(401).send({
          success: false,
          errorCode: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
      }

      const body = requestFastify.body;
      const validationError = validateRequestBody(body);

      if (validationError) {
        return reply.code(400).send({
          success: false,
          errorCode: 'VALIDATION_ERROR',
          message: validationError,
        });
      }

      const requestBody: DownloadFileRequest = {
        ...body,
        targetFolder: normalizeTargetFolder(body.targetFolder)!,
        fileName: body.fileName.trim(),
        url: body.url.trim(),
      };

      requestFastify.log.info(
        {
          url: requestBody.url,
          targetFolder: requestBody.targetFolder,
          fileName: requestBody.fileName,
        },
        'Download request received'
      );

      const result = await processDownload(requestBody);

      requestFastify.log.info(
        {
          url: result.url,
          savedPath: result.savedPath,
          skipped: result.skipped,
        },
        result.skipped ? 'Download skipped: file already exists' : 'Download completed successfully'
      );

      return reply.code(200).send(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      requestFastify.log.error(
        {
          error: errorMessage,
        },
        'Download failed'
      );

      return reply.code(500).send({
        success: false,
        errorCode: 'DOWNLOAD_ERROR',
        message: errorMessage,
      });
    }
  }
);

async function shutdown(signal: string): Promise<void> {
  try {
    fastify.log.info({ signal }, 'Shutting down server');
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error(error, 'Failed to shut down gracefully');
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

async function start(): Promise<void> {
  try {
    const address = await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    fastify.log.info({ address, apiPrefix: API_PREFIX }, 'Server started');
  } catch (error) {
    fastify.log.error(error, 'Listen error');
    process.exit(1);
  }
}

void start();