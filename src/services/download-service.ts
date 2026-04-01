import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { request } from 'undici';
import { DownloadFileRequest, DownloadFileResponse } from '../types/download';
import { normalizeTargetFolder, sanitizeFileName } from '../utils/validation';
import { config } from '../config';

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fsp.stat(filePath);
    return true;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return false;
    }

    throw new Error(
      `Failed to check path "${filePath}": ${nodeError.message || 'Unknown error'}`
    );
  }
}

async function ensureDirectoryExistsAndWritable(dirPath: string): Promise<void> {
  try {
    const stat = await fsp.stat(dirPath);

    if (!stat.isDirectory()) {
      throw new Error(`Target folder is not a directory: ${dirPath}`);
    }

    await fsp.access(dirPath, fs.constants.W_OK);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      throw new Error(`Target folder does not exist: ${dirPath}`);
    }

    if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
      throw new Error(`No write access to target folder: ${dirPath}`);
    }

    if (
      error instanceof Error &&
      error.message.startsWith('Target folder is not a directory:')
    ) {
      throw error;
    }

    throw new Error(
      `Failed to access target folder "${dirPath}": ${nodeError.message || 'Unknown error'}`
    );
  }
}

async function removeFileIfExists(filePath: string): Promise<void> {
  try {
    await fsp.rm(filePath, { force: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    throw new Error(
      `Failed to remove temporary file "${filePath}": ${nodeError.message || 'Unknown error'}`
    );
  }
}

export async function processDownload(
  requestBody: DownloadFileRequest
): Promise<DownloadFileResponse> {
  const normalizedTargetFolder = normalizeTargetFolder(requestBody.targetFolder);
  if (!normalizedTargetFolder) {
    throw new Error('targetFolder is invalid');
  }

  await ensureDirectoryExistsAndWritable(normalizedTargetFolder);

  const safeFileName = sanitizeFileName(requestBody.fileName);
  if (!safeFileName) {
    throw new Error('fileName is invalid');
  }

  const savedPath = path.join(normalizedTargetFolder, safeFileName);
  const tempPath = `${savedPath}.part`;

  if (await pathExists(savedPath)) {
    return {
      success: true,
      skipped: true,
      message: 'File already exists',
      url: requestBody.url,
      fileName: safeFileName,
      savedPath,
    };
  }

  await removeFileIfExists(tempPath);

  let responseBody: NodeJS.ReadableStream | null = null;

  try {
    const response = await request(requestBody.url, {
      headersTimeout: config.download.headersTimeoutMs,
      bodyTimeout: config.download.bodyTimeoutMs,
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to download file. Status code: ${response.statusCode}`);
    }

    responseBody = response.body;

    if (!responseBody) {
      throw new Error('Remote server returned an empty response body');
    }

    await pipeline(
      responseBody,
      fs.createWriteStream(tempPath, { flags: 'wx' })
    );

    await fsp.rename(tempPath, savedPath);

    return {
      success: true,
      skipped: false,
      message: 'File downloaded successfully',
      url: requestBody.url,
      fileName: safeFileName,
      savedPath,
    };
  } catch (error) {
    await removeFileIfExists(tempPath);
    throw error;
  }
}