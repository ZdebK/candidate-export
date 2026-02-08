import { stringify } from 'csv-stringify';
import * as fs from 'fs';
import * as path from 'path';
import type { CandidateRow } from '../types/teamtailor.types';

const CSV_HEADERS = [
  'candidate_id',
  'first_name',
  'last_name',
  'email',
  'job_application_id',
  'job_application_created_at',
] as const;

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

export function ensureExportsDir(): void {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

export function buildFileName(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('Z')[0];
  return `candidates_${timestamp}.csv`;
}

export async function generateCsv(
  rows: CandidateRow[],
  fileName: string,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  ensureExportsDir();

  const filePath = path.join(EXPORTS_DIR, fileName);
  const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
  const batchSize = 100;
  let processed = 0;

  return new Promise((resolve, reject) => {
    const stringifier = stringify({ header: true, columns: CSV_HEADERS as unknown as string[] });

    writeStream.on('error', reject);
    stringifier.on('error', reject);
    stringifier.on('finish', () => resolve(filePath));

    stringifier.pipe(writeStream);

    // Write rows in batches to avoid blocking the event loop
    const writeBatch = () => {
      const batch = rows.slice(processed, processed + batchSize);

      for (const row of batch) {
        stringifier.write([
          row.candidate_id,
          row.first_name,
          row.last_name,
          row.email,
          row.job_application_id,
          row.job_application_created_at,
        ]);
      }

      processed += batch.length;
      onProgress?.(Math.round((processed / rows.length) * 100));

      if (processed < rows.length) {
        setImmediate(writeBatch);
      } else {
        stringifier.end();
      }
    };

    writeBatch();
  });
}

export function deleteFile(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // File may already be gone — ignore
  }
}
