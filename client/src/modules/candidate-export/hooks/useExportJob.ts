import { useState, useCallback, useRef } from 'react';
import { useExportPolling } from './useExportPolling';
import { setCachedExport } from '../utils/export-cache.util';
import type { ExportJob, ExportStatusResponse, StartExportResponse } from '../types/export.types';

const API_BASE = '/api/candidate-export';

const INITIAL_JOB: Omit<ExportJob, 'jobId' | 'createdAt'> = {
  status: 'pending',
  progress: {
    percentage: 0,
    stage: 'Preparing export...',
    candidatesProcessed: 0,
    totalCandidates: 0,
  },
};

interface UseExportJobReturn {
  job: ExportJob | null;
  startExport: (counts?: { candidates: number; applications: number }) => Promise<void>;
  downloadPrevious: (jobId: string) => void;
  resetJob: () => void;
}

export function useExportJob(): UseExportJobReturn {
  const [job, setJob] = useState<ExportJob | null>(null);
  const savedCountsRef = useRef<{ candidates: number; applications: number } | null>(null);

  const updateFromStatus = useCallback((response: ExportStatusResponse) => {
    setJob((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: response.status,
        progress: response.progress,
        result: response.result,
        error: response.error,
        ...(response.status === 'completed' && { completedAt: new Date().toISOString() }),
      };
    });

    // Trigger download when complete and save to cache
    if (response.status === 'completed' && response.result) {
      const result = response.result;
      setJob((prev) => {
        if (prev?.jobId) {
          triggerDownload(prev.jobId);

          // Save to cache for future use
          const counts = savedCountsRef.current;
          if (counts && result) {
            setCachedExport(
              prev.jobId,
              counts.candidates,
              counts.applications,
              result.fileName,
            );
          }
        }
        return prev;
      });
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('[Export] Polling error:', error.message);
    setJob((prev) =>
      prev
        ? {
            ...prev,
            status: 'failed',
            error: { message: error.message, code: 'POLL_ERROR' },
          }
        : null,
    );
  }, []);

  useExportPolling({
    jobId: job?.jobId ?? null,
    onUpdate: updateFromStatus,
    onError: handleError,
  });

  const startExport = useCallback(async (counts?: { candidates: number; applications: number }) => {
    try {
      // Save counts for cache later
      if (counts) {
        savedCountsRef.current = counts;
      }

      const response = await fetch(`${API_BASE}/start`, { method: 'POST' });

      if (!response.ok) {
        throw new Error(`Failed to start export: ${response.status}`);
      }

      const data = (await response.json()) as StartExportResponse;

      setJob({
        ...INITIAL_JOB,
        jobId: data.jobId,
        status: data.status,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start export';
      setJob({
        jobId: 'error',
        status: 'failed',
        progress: { ...INITIAL_JOB.progress, stage: 'Failed to start' },
        error: { message, code: 'START_ERROR' },
        createdAt: new Date().toISOString(),
      });
    }
  }, []);

  const downloadPrevious = useCallback((jobId: string) => {
    triggerDownload(jobId);
  }, []);

  const resetJob = useCallback(() => {
    setJob(null);
  }, []);

  return { job, startExport, downloadPrevious, resetJob };
}

function triggerDownload(jobId: string): void {
  const url = `${API_BASE}/download/${jobId}`;
  const link = document.createElement('a');
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
