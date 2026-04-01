import path from 'path';
import { DownloadBatchRequest, DownloadItemRequest } from '../types/download';

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

export function normalizeFolderPath(folderPath: string): string | null {
  const trimmed = folderPath.trim();

  if (!trimmed) {
    return null;
  }

  const resolvedPath = path.resolve(trimmed);

  if (!path.isAbsolute(resolvedPath)) {
    return null;
  }

  const parsed = path.parse(resolvedPath);

  if (resolvedPath === parsed.root) {
    return null;
  }

  return resolvedPath;
}

function validateFileItem(item: Partial<DownloadItemRequest>, index: number): string | null {
  if (!item.fileName || typeof item.fileName !== 'string') {
    return `files[${index}].fileName is required and must be a string`;
  }

  if (sanitizeFileName(item.fileName) === null) {
    return `files[${index}].fileName is invalid`;
  }

  if (!item.url || typeof item.url !== 'string') {
    return `files[${index}].url is required and must be a string`;
  }

  if (!isValidHttpUrl(item.url)) {
    return `files[${index}].url must be a valid http/https URL`;
  }

  return null;
}

export function validateBatchRequestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const requestBody = body as Partial<DownloadBatchRequest>;

  if (!Array.isArray(requestBody.files)) {
    return 'files is required and must be an array';
  }

  if (requestBody.files.length === 0) {
    return 'files must contain at least one item';
  }

  for (let i = 0; i < requestBody.files.length; i += 1) {
    const item = requestBody.files[i];
    const itemError = validateFileItem(item ?? {}, i);
    if (itemError) {
      return itemError;
    }
  }

  return null;
}