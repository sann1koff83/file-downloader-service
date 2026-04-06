import fs from 'fs';
import path from 'path';

export interface AppConfig {
  server: {
    host: string;
    port: number;
  };
  storage: {
    targetFolder: string;
    tempFolder: string;
  };
  download: {
    headersTimeoutMs: number;
    bodyTimeoutMs: number;
    concurrency: number;
  };
  cleanup: {
    cron: string;
    olderThanHours: number;
  };
  security: {
    apiKey: string;
  };
}

function resolveConfigPath(): string {
  const candidates = [
    path.resolve(__dirname, '../config.json'),
    path.resolve(process.cwd(), 'config.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Config file not found. Checked paths: ${candidates.join(', ')}`);
}

function loadConfig(): AppConfig {
  const configPath = resolveConfigPath();
  const fileContent = fs.readFileSync(configPath, 'utf-8');

  let parsedConfig: unknown;
  try {
    parsedConfig = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(
      `Config file is not valid JSON: ${configPath}. ${
        error instanceof Error ? error.message : 'Unknown parse error'
      }`
    );
  }

  if (!parsedConfig || typeof parsedConfig !== 'object') {
    throw new Error('Config error: config root must be an object');
  }

  const config = parsedConfig as Partial<AppConfig>;

  if (!config.server) {
    throw new Error('Config error: server section is required');
  }

  if (!config.storage) {
    throw new Error('Config error: storage section is required');
  }

  if (!config.download) {
    throw new Error('Config error: download section is required');
  }

  if (!config.cleanup) {
    throw new Error('Config error: cleanup section is required');
  }

  if (!config.security) {
    throw new Error('Config error: security section is required');
  }

  if (!config.server.host || typeof config.server.host !== 'string') {
    throw new Error('Config error: server.host must be a string');
  }

  if (
    typeof config.server.port !== 'number' ||
    !Number.isInteger(config.server.port) ||
    config.server.port <= 0
  ) {
    throw new Error('Config error: server.port must be a positive integer');
  }

  if (
    !config.storage.targetFolder ||
    typeof config.storage.targetFolder !== 'string'
  ) {
    throw new Error('Config error: storage.targetFolder must be a non-empty string');
  }

  if (
    !config.storage.tempFolder ||
    typeof config.storage.tempFolder !== 'string'
  ) {
    throw new Error('Config error: storage.tempFolder must be a non-empty string');
  }

  if (
    typeof config.download.headersTimeoutMs !== 'number' ||
    config.download.headersTimeoutMs <= 0
  ) {
    throw new Error(
      'Config error: download.headersTimeoutMs must be a positive number'
    );
  }

  if (
    typeof config.download.bodyTimeoutMs !== 'number' ||
    config.download.bodyTimeoutMs <= 0
  ) {
    throw new Error(
      'Config error: download.bodyTimeoutMs must be a positive number'
    );
  }

  if (
    typeof config.download.concurrency !== 'number' ||
    !Number.isInteger(config.download.concurrency) ||
    config.download.concurrency <= 0
  ) {
    throw new Error(
      'Config error: download.concurrency must be a positive integer'
    );
  }

  if (!config.cleanup.cron || typeof config.cleanup.cron !== 'string') {
    throw new Error('Config error: cleanup.cron must be a non-empty string');
  }

  if (
    typeof config.cleanup.olderThanHours !== 'number' ||
    config.cleanup.olderThanHours <= 0
  ) {
    throw new Error('Config error: cleanup.olderThanHours must be a positive number');
  }

  if (!config.security.apiKey || typeof config.security.apiKey !== 'string') {
    throw new Error('Config error: security.apiKey must be a non-empty string');
  }

  return config as AppConfig;
}

export const config = loadConfig();