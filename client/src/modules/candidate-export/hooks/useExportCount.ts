import { useState, useEffect } from 'react';

export interface ExportCounts {
  candidates: number;
  applications: number;
}

export function useExportCount() {
  const [counts, setCounts] = useState<ExportCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/candidate-export/count')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch candidate count');
        return r.json() as Promise<ExportCounts>;
      })
      .then((data) => setCounts(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return { counts, loading, error };
}
