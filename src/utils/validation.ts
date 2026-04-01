import path from 'path';
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

export function normalizeTargetFolder(targetFolder: string): string | null {
  const trimmed = targetFolder.trim();

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

export function validateRequestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const requestBody = body as Partial<DownloadFileRequest>;

  if (!requestBody.targetFolder || typeof requestBody.targetFolder !== 'string') {
    return 'targetFolder is required and must be a string';
  }

  if (normalizeTargetFolder(requestBody.targetFolder) === null) {
    return 'targetFolder must be a valid absolute path and cannot be a disk root';
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