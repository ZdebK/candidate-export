export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportProgress {
  percentage: number;
  stage: string;
  candidatesProcessed: number;
  totalCandidates: number;
  applicationsProcessed: number;
  totalApplications: number;
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  recordCount: number;
}

export interface ExportError {
  message: string;
  code: string;
}

export interface ExportJob {
  jobId: string;
  status: ExportStatus;
  progress: ExportProgress;
  result?: ExportResult;
  error?: ExportError;
  createdAt: string;
  completedAt?: string;
}

const DEFAULT_PROGRESS: ExportProgress = {
  percentage: 0,
  stage: 'Initializing...',
  candidatesProcessed: 0,
  totalCandidates: 0,
  applicationsProcessed: 0,
  totalApplications: 0,
};

// In-memory store — replace with Redis for production
class ExportJobStore {
  private jobs = new Map<string, ExportJob>();

  create(jobId: string): ExportJob {
    const job: ExportJob = {
      jobId,
      status: 'pending',
      progress: { ...DEFAULT_PROGRESS },
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  get(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  update(jobId: string, patch: Partial<ExportJob>): ExportJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const updated = { ...job, ...patch };
    this.jobs.set(jobId, updated);
    return updated;
  }

  delete(jobId: string): void {
    this.jobs.delete(jobId);
  }

  has(jobId: string): boolean {
    return this.jobs.has(jobId);
  }
}

export const exportJobStore = new ExportJobStore();
