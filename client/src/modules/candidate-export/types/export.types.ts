export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportProgress {
  percentage: number;
  stage: string;
  candidatesProcessed: number;
  totalCandidates: number;
}

export interface ExportResult {
  fileUrl: string;
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

export interface StartExportResponse {
  jobId: string;
  status: ExportStatus;
}

export interface ExportStatusResponse {
  status: ExportStatus;
  progress: ExportProgress;
  result?: ExportResult;
  error?: ExportError;
}
