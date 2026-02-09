import { exportJobStore } from '../models/export-job.model';
import { logger } from '../../../shared/utils/logger.util';
import type { ExportProgress } from '../models/export-job.model';

export class ProgressTracker {
  constructor(private readonly jobId: string) {}

  update(patch: Partial<ExportProgress>): void {
    const job = exportJobStore.get(this.jobId);
    if (!job) return;

    exportJobStore.update(this.jobId, {
      status: 'processing',
      progress: { ...job.progress, ...patch },
    });

    const { stage, percentage } = { ...job.progress, ...patch };
    logger.info(`Job ${this.jobId}: ${stage}`, { percentage });
  }

  candidatesPhase(processed: number, total: number): void {
    this.update({
      stage: 'Fetching candidates',
      candidatesProcessed: processed,
      totalCandidates: total,
      percentage: total > 0 ? Math.round((processed / total) * 90) : 0,
    });
  }
}
