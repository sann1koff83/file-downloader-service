import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { config } from './config';
import { isAuthorized } from './utils/auth';
import { validateBatchRequestBody } from './utils/validation';
import { DownloadBatchRequest } from './types/download';
import {
  processDownloadBatch,
  validateStorageAvailability,
} from './services/download-service';
import { startCleanupJob } from './services/cleanup-service';

const fastify = Fastify({
  logger: true,
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

fastify.post(
  '/api/downloads',
  async (
    requestFastify: FastifyRequest<{ Body: DownloadBatchRequest }>,
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
      const validationError = validateBatchRequestBody(body);

      if (validationError) {
        return reply.code(400).send({
          success: false,
          errorCode: 'VALIDATION_ERROR',
          message: validationError,
        });
      }

      const normalizedRequest: DownloadBatchRequest = {
        files: body.files.map((item) => ({
          url: item.url.trim(),
          fileName: item.fileName.trim(),
        })),
      };

      requestFastify.log.info(
        {
          filesCount: normalizedRequest.files.length,
        },
        'Download batch request received'
      );

      const result = await processDownloadBatch(normalizedRequest);

      requestFastify.log.info(
        {
          filesCount: result.files.length,
        },
        'Download batch completed successfully'
      );

      return reply.code(200).send(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      requestFastify.log.error(
        {
          error: errorMessage,
        },
        'Download batch failed'
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
    await validateStorageAvailability();

    startCleanupJob(fastify.log);

    const address = await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    fastify.log.info({ address }, 'Server started');
  } catch (error) {
    fastify.log.error(error, 'Startup failed');
    process.exit(1);
  }
}

void start();