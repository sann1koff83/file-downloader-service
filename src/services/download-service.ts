import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { request } from 'undici';

import { DownloadFileRequest, DownloadFileResponse } from '../types/download';
import { sanitizeFileName } from '../utils/validation';
import { config } from '../config';

export async function processDownload(
  requestBody: DownloadFileRequest
): Promise<DownloadFileResponse> {
  const targetFolder = requestBody.targetFolder;

  await fsp.mkdir(targetFolder, { recursive: true });

  const safeFileName = sanitizeFileName(requestBody.fileName);

  if (!safeFileName) {
    throw new Error('fileName is invalid');
  }

  const savedPath = path.join(targetFolder, safeFileName);

  const response = await request(requestBody.url, {
    headersTimeout: config.download.headersTimeoutMs,
    bodyTimeout: config.download.bodyTimeoutMs
  });

  if (response.statusCode !== 200) {
    throw new Error(`Failed to download file. Status code: ${response.statusCode}`);
  }

  await pipeline(response.body, fs.createWriteStream(savedPath));

  return {
    message: 'File downloaded successfully',
    url: requestBody.url,
    fileName: safeFileName,
    savedPath
  };
}