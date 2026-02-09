import { stringify } from 'csv-stringify/sync';
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

export function generateCsv(rows: CandidateRow[], fileName: string): string {
  ensureExportsDir();

  const filePath = path.join(EXPORTS_DIR, fileName);

  const output = stringify(
    rows.map((row) => [
      row.candidate_id,
      row.first_name,
      row.last_name,
      row.email,
      row.job_application_id,
      row.job_application_created_at,
    ]),
    { header: true, columns: [...CSV_HEADERS] },
  );

  fs.writeFileSync(filePath, output, 'utf-8');

  return filePath;
}

export function deleteFile(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // File may already be gone — ignore
  }
}
