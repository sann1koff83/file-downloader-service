import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { config } from '../config';
import { normalizeFolderPath } from '../utils/validation';

async function cleanupTempFolder(): Promise<void> {
  const tempFolder = normalizeFolderPath(config.storage.tempFolder);

  if (!tempFolder) {
    throw new Error('storage.tempFolder is invalid');
  }

  const thresholdTime = Date.now() - config.cleanup.olderThanHours * 60 * 60 * 1000;
  const entries = await fs.readdir(tempFolder, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(tempFolder, entry.name);
    const stat = await fs.stat(fullPath);

    if (stat.mtimeMs < thresholdTime) {
      await fs.rm(fullPath, { recursive: true, force: true });
    }
  }
}

export function startCleanupJob(logger: { info: Function; error: Function }): void {
  if (!cron.validate(config.cleanup.cron)) {
    throw new Error(`Invalid cleanup cron expression: ${config.cleanup.cron}`);
  }

  logger.info(
    {
      cron: config.cleanup.cron,
      olderThanHours: config.cleanup.olderThanHours,
      tempFolder: config.storage.tempFolder,
    },
    'Starting temp cleanup job'
  );

  cron.schedule(config.cleanup.cron, async () => {
    try {
      await cleanupTempFolder();
      logger.info('Temp cleanup completed successfully');
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'Temp cleanup failed'
      );
    }
  });
}