import fs from 'fs';
import path from 'path';

export interface AppConfig {
  server: {
    host: string;
    port: number;
  };
  download: {
    headersTimeoutMs: number;
    bodyTimeoutMs: number;
  };
  security: {
    apiKey: string;
  };
}

function loadConfig(): AppConfig {
  const configPath = path.resolve(process.cwd(), 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const fileContent = fs.readFileSync(configPath, 'utf-8');
  const parsedConfig = JSON.parse(fileContent) as AppConfig;

  if (!parsedConfig.server) {
    throw new Error('Config error: server section is required');
  }

  if (!parsedConfig.download) {
    throw new Error('Config error: download section is required');
  }

  if (!parsedConfig.security) {
    throw new Error('Config error: security section is required');
  }

  return parsedConfig;
}

export const config = loadConfig();