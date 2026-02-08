import { config } from '../../../shared/config/env.config';
import { paginatedFetch } from '../utils/api-client.util';
import type {
  CandidateAttributes,
  CandidateResource,
  JobApplicationAttributes,
  JobApplicationResource,
  CandidateRow,
} from '../types/teamtailor.types';

interface FetchResult {
  candidates: CandidateResource[];
  applicationsByCandidateId: Map<string, JobApplicationResource[]>;
  totalApplications: number;
}

export async function fetchAllCandidatesWithApplications(
  onProgress?: (candidatesProcessed: number, total: number) => void,
): Promise<FetchResult> {
  const candidates: CandidateResource[] = [];
  // Deduplicate included job-applications across pages
  const allAppsById = new Map<string, JobApplicationResource>();

  // Single endpoint — candidates with job-applications included
  const startUrl = `${config.teamtailor.apiUrl}/candidates?include=job-applications&page[size]=30`;

  for await (const page of paginatedFetch<CandidateAttributes>(startUrl)) {
    // Collect all included job-application resources (deduped by ID)
    if (page.included) {
      for (const resource of page.included) {
        if (resource.type === 'job-applications') {
          allAppsById.set(resource.id, resource as JobApplicationResource);
        }
      }
    }

    candidates.push(...page.data);
    const total = page.meta['record-count'];
    onProgress?.(candidates.length, total);
    console.log(`[Teamtailor] Candidates: ${candidates.length}/${total}, apps seen: ${allAppsById.size}`);
  }

  // Build lookup: candidate_id → JobApplicationResource[]
  const applicationsByCandidateId = new Map<string, JobApplicationResource[]>();

  for (const candidate of candidates) {
    const appRefs = candidate.relationships?.['job-applications']?.data;
    if (!Array.isArray(appRefs)) continue;

    const apps: JobApplicationResource[] = [];
    for (const ref of appRefs) {
      const app = allAppsById.get(ref.id);
      if (app) apps.push(app);
    }

    if (apps.length > 0) {
      applicationsByCandidateId.set(candidate.id, apps);
    }
  }

  return { candidates, applicationsByCandidateId, totalApplications: allAppsById.size };
}

export function buildCandidateRows(
  candidates: CandidateResource[],
  applicationsByCandidateId: Map<string, JobApplicationResource[]>,
): CandidateRow[] {
  const rows: CandidateRow[] = [];

  for (const candidate of candidates) {
    const attrs = candidate.attributes;
    const apps = applicationsByCandidateId.get(candidate.id) ?? [];

    for (const app of apps) {
      rows.push({
        candidate_id: candidate.id,
        first_name: attrs['first-name'] ?? '',
        last_name: attrs['last-name'] ?? '',
        email: attrs.email ?? '',
        job_application_id: app.id,
        job_application_created_at: app.attributes['created-at'] ?? '',
      });
    }
  }

  return rows;
}
