import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { request } from 'undici';
import { config } from '../config';
import {
  DownloadBatchRequest,
  DownloadBatchResponse,
  DownloadItemRequest,
  DownloadedFileInfo,
} from '../types/download';
import { normalizeFolderPath, sanitizeFileName } from '../utils/validation';

interface PreparedFile {
  sourceFileName: string;
  generatedFileName: string;
  tempPath: string;
  finalPath: string;
  url: string;
}

async function ensureDirectoryExistsAndWritable(
  dirPath: string,
  directoryLabel: string
): Promise<void> {
  try {
    const stat = await fsp.stat(dirPath);

    if (!stat.isDirectory()) {
      throw new Error(`${directoryLabel} is not a directory: ${dirPath}`);
    }

    await fsp.access(dirPath, fs.constants.W_OK);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      throw new Error(`${directoryLabel} does not exist: ${dirPath}`);
    }

    if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
      throw new Error(`No write access to ${directoryLabel.toLowerCase()}: ${dirPath}`);
    }

    if (
      error instanceof Error &&
      error.message.startsWith(`${directoryLabel} is not a directory:`)
    ) {
      throw error;
    }

    throw new Error(
      `Failed to access ${directoryLabel.toLowerCase()} "${dirPath}": ${
        nodeError.message || 'Unknown error'
      }`
    );
  }
}

export async function validateStorageAvailability(): Promise<void> {
  const targetFolder = normalizeFolderPath(config.storage.targetFolder);
  const tempFolder = normalizeFolderPath(config.storage.tempFolder);

  if (!targetFolder) {
    throw new Error('storage.targetFolder is invalid');
  }

  if (!tempFolder) {
    throw new Error('storage.tempFolder is invalid');
  }

  await ensureDirectoryExistsAndWritable(targetFolder, 'Target folder');
  await ensureDirectoryExistsAndWritable(tempFolder, 'Temp folder');
}

function buildGeneratedFileName(originalFileName: string): string {
  const safeFileName = sanitizeFileName(originalFileName);
  if (!safeFileName) {
    throw new Error(`Invalid fileName: ${originalFileName}`);
  }

  const extension = path.extname(safeFileName);
  const baseName = path.basename(safeFileName, extension);
  const requestId = crypto.randomUUID();

  return extension
    ? `${baseName}-${requestId}${extension}`
    : `${baseName}-${requestId}`;
}

async function downloadSingleFile(
  item: DownloadItemRequest,
  tempRequestFolder: string,
  targetFolder: string
): Promise<PreparedFile> {
  const safeFileName = sanitizeFileName(item.fileName);
  if (!safeFileName) {
    throw new Error(`Invalid fileName: ${item.fileName}`);
  }

  const generatedFileName = buildGeneratedFileName(safeFileName);
  const tempPath = path.join(tempRequestFolder, generatedFileName);
  const finalPath = path.join(targetFolder, generatedFileName);

  const response = await request(item.url, {
    headersTimeout: config.download.headersTimeoutMs,
    bodyTimeout: config.download.bodyTimeoutMs,
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `Failed to download file "${safeFileName}". Status code: ${response.statusCode}`
    );
  }

  if (!response.body) {
    throw new Error(`Remote server returned an empty response body for "${safeFileName}"`);
  }

  await pipeline(
    response.body,
    fs.createWriteStream(tempPath, { flags: 'wx' })
  );

  return {
    sourceFileName: safeFileName,
    generatedFileName,
    tempPath,
    finalPath,
    url: item.url,
  };
}

async function runWithConcurrency<TInput, TResult>(
  items: TInput[],
  concurrency: number,
  handler: (item: TInput, index: number) => Promise<TResult>
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length);
  let nextIndex = 0;
  let firstError: unknown = null;

  async function worker(): Promise<void> {
    while (true) {
      if (firstError) {
        return;
      }

      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      try {
        results[currentIndex] = await handler(items[currentIndex], currentIndex);
      } catch (error) {
        firstError = error;
        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (firstError) {
    throw firstError;
  }

  return results;
}

export async function processDownloadBatch(
  requestBody: DownloadBatchRequest
): Promise<DownloadBatchResponse> {
  const targetFolder = normalizeFolderPath(config.storage.targetFolder);
  const tempFolder = normalizeFolderPath(config.storage.tempFolder);

  if (!targetFolder) {
    throw new Error('storage.targetFolder is invalid');
  }

  if (!tempFolder) {
    throw new Error('storage.tempFolder is invalid');
  }

  await validateStorageAvailability();

  const tempRequestFolder = path.join(tempFolder, crypto.randomUUID());
  await fsp.mkdir(tempRequestFolder, { recursive: false });

  try {
    const preparedFiles = await runWithConcurrency(
      requestBody.files,
      config.download.concurrency,
      async (item) => downloadSingleFile(item, tempRequestFolder, targetFolder)
    );

    const movedFiles: DownloadedFileInfo[] = [];

    for (const preparedFile of preparedFiles) {
      await fsp.rename(preparedFile.tempPath, preparedFile.finalPath);

      movedFiles.push({
        sourceFileName: preparedFile.sourceFileName,
        generatedFileName: preparedFile.generatedFileName,
        savedPath: preparedFile.finalPath,
        url: preparedFile.url,
      });
    }

    await fsp.rm(tempRequestFolder, { recursive: true, force: true });

    return {
      success: true,
      message: 'Files downloaded successfully',
      files: movedFiles,
    };
  } catch (error) {
    throw error;
  }
}