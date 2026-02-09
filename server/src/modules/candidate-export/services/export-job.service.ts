import { exportJobStore } from '../models/export-job.model';
import { ProgressTracker } from './progress-tracker.service';
import { fetchAllCandidatesWithApplications, buildCandidateRows } from './teamtailor.service';
import { generateCsv, buildFileName } from './csv-generator.service';
import { logger } from '../../../shared/utils/logger.util';
import type { ExportJob } from '../models/export-job.model';

export function createExportJob(): ExportJob {
  const jobId = crypto.randomUUID();
  const job = exportJobStore.create(jobId);

  logger.info('Export job created', { jobId });

  runExportJob(jobId).catch((error) => {
    logger.error('Export job unhandled error', error, { jobId });
    exportJobStore.update(jobId, {
      status: 'failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR',
      },
      completedAt: new Date().toISOString(),
    });
  });

  return job;
}

export function getExportJob(jobId: string): ExportJob | undefined {
  return exportJobStore.get(jobId);
}

async function runExportJob(jobId: string): Promise<void> {
  const tracker = new ProgressTracker(jobId);

  try {
    tracker.update({ stage: 'Fetching candidates...', percentage: 5 });
    const { candidates, applicationsByCandidateId, totalApplications } =
      await fetchAllCandidatesWithApplications((processed, total) => {
        tracker.candidatesPhase(processed, total);
      });

    tracker.update({ stage: 'Generating CSV...', percentage: 95 });
    const rows = buildCandidateRows(candidates, applicationsByCandidateId);

    const fileName = buildFileName();
    const filePath = generateCsv(rows, fileName);

    exportJobStore.update(jobId, {
      status: 'completed',
      progress: {
        percentage: 100,
        stage: 'Complete',
        candidatesProcessed: candidates.length,
        totalCandidates: candidates.length,
        applicationsProcessed: totalApplications, // All applications processed at this point
        totalApplications,
      },
      result: { filePath, fileName, recordCount: rows.length },
      completedAt: new Date().toISOString(),
    });

    logger.info('Export job completed', { jobId, records: rows.length, fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const code = (error as { code?: string }).code ?? 'EXPORT_ERROR';

    exportJobStore.update(jobId, {
      status: 'failed',
      error: { message, code },
      completedAt: new Date().toISOString(),
    });

    logger.error('Export job failed', error, { jobId });
  }
}
