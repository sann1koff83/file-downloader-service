import { FastifyRequest } from 'fastify';
import { config } from '../config';

export function isAuthorized(request: FastifyRequest): boolean {
  const apiKeyHeader = request.headers['x-api-key'];

  if (typeof apiKeyHeader !== 'string') {
    return false;
  }

  return apiKeyHeader === config.security.apiKey;
}