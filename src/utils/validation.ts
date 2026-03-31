import { DownloadFileRequest } from '../types/download';

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeFileName(fileName: string): string | null {
  const trimmed = fileName.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return null;
  }

  if (trimmed === '.' || trimmed === '..') {
    return null;
  }

  return trimmed;
}

export function validateRequestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const requestBody = body as Partial<DownloadFileRequest>;

  if (!requestBody.targetFolder || typeof requestBody.targetFolder !== 'string') {
    return 'targetFolder is required and must be a string';
  }

  if (!requestBody.url || typeof requestBody.url !== 'string') {
    return 'url is required and must be a string';
  }

  if (!isValidHttpUrl(requestBody.url)) {
    return 'url must be a valid http/https URL';
  }

  if (!requestBody.fileName || typeof requestBody.fileName !== 'string') {
    return 'fileName is required and must be a string';
  }

  if (sanitizeFileName(requestBody.fileName) === null) {
    return 'fileName is invalid';
  }

  return null;
}