import { useEffect, useRef, useCallback } from 'react';
import type { ExportJob, ExportStatusResponse } from '../types/export.types';

const POLL_INTERVAL_MS = 2500;
const API_BASE = '/api/candidate-export';

interface UseExportPollingOptions {
  jobId: string | null;
  onUpdate: (response: ExportStatusResponse) => void;
  onError: (error: Error) => void;
}

export function useExportPolling({ jobId, onUpdate, onError }: UseExportPollingOptions): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Keep callbacks fresh without restarting polling
  onUpdateRef.current = onUpdate;
  onErrorRef.current = onError;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) {
      stopPolling();
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/status/${jobId}`);

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const data = (await response.json()) as ExportStatusResponse;
        onUpdateRef.current(data);

        // Stop polling when job is terminal
        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling();
        }
      } catch (error) {
        onErrorRef.current(error instanceof Error ? error : new Error('Polling failed'));
      }
    };

    // Poll immediately, then on interval
    void poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return stopPolling;
  }, [jobId, stopPolling]);
}

export function isTerminalStatus(status: ExportJob['status']): boolean {
  return status === 'completed' || status === 'failed';
}
