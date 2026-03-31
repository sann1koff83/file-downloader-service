import Fastify from 'fastify';

import { config } from './config';
import { DownloadFileRequest } from './types/download';
import { isAuthorized } from './utils/auth';
import { validateRequestBody } from './utils/validation';
import { processDownload } from './services/download-service';

const fastify = Fastify({
  logger: true
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

fastify.get('/config', async () => {
  return {
    server: config.server,
    download: config.download,
    security: {
      apiKeyConfigured: Boolean(config.security.apiKey)
    }
  };
});

fastify.post('/api/downloads', async (requestFastify, reply) => {
  try {
    if (!isAuthorized(requestFastify)) {
      return reply.code(401).send({
        error: 'Unauthorized'
      });
    }

    const body = requestFastify.body;
    const validationError = validateRequestBody(body);

    if (validationError) {
      return reply.code(400).send({
        error: validationError
      });
    }

    const requestBody = body as DownloadFileRequest;
    const result = await processDownload(requestBody);

    return result;
  } catch (error) {
    requestFastify.log.error(error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return reply.code(500).send({
      error: errorMessage
    });
  }
});

async function start(): Promise<void> {
  try {
    const address = await fastify.listen({
      host: config.server.host,
      port: config.server.port
    });

    console.log(`Server started at: ${address}`);
  } catch (error) {
    console.error('Listen error:', error);
    process.exit(1);
  }
}

start();