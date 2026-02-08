import * as dotenv from 'dotenv';
import * as path from 'path';

// Look for .env in server/ first, then fall back to project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const requiredEnvVars = ['TEAMTAILOR_API_KEY', 'TEAMTAILOR_API_URL'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  teamtailor: {
    apiKey: process.env.TEAMTAILOR_API_KEY as string,
    apiUrl: process.env.TEAMTAILOR_API_URL as string,
    apiVersion: process.env.TEAMTAILOR_API_VERSION ?? '20240404',
  },
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  export: {
    batchSize: parseInt(process.env.EXPORT_BATCH_SIZE ?? '100', 10),
    delayMs: parseInt(process.env.EXPORT_DELAY_MS ?? '150', 10),
    maxRetries: parseInt(process.env.EXPORT_MAX_RETRIES ?? '3', 10),
    fileRetentionHours: parseInt(process.env.EXPORT_FILE_RETENTION_HOURS ?? '24', 10),
  },
} as const;

export type Config = typeof config;
