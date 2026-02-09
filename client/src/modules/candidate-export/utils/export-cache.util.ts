interface CachedExport {
  jobId: string;
  candidatesCount: number;
  applicationsCount: number;
  fileName: string;
  timestamp: string;
}

const CACHE_KEY = 'lastExport';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedExport(): CachedExport | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedExport = JSON.parse(cached);

    // Check if cache expired (24h)
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function setCachedExport(
  jobId: string,
  candidatesCount: number,
  applicationsCount: number,
  fileName: string,
): void {
  const data: CachedExport = {
    jobId,
    candidatesCount,
    applicationsCount,
    fileName,
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearCachedExport(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}

export function isCacheValid(
  cachedExport: CachedExport | null,
  currentCandidates: number,
  currentApplications: number,
): boolean {
  if (!cachedExport) return false;

  return (
    cachedExport.candidatesCount === currentCandidates &&
    cachedExport.applicationsCount === currentApplications
  );
}
