import { config } from '../../../shared/config/env.config';
import { fetchPage } from '../utils/api-client.util';
import pLimit from 'p-limit';
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

export interface ExportCounts {
  candidates: number;
  applications: number;
}

export async function fetchCandidateCount(): Promise<ExportCounts> {
  const [candidatesPage, applicationsPage] = await Promise.all([
    fetchPage<CandidateAttributes>(`${config.teamtailor.apiUrl}/candidates?page[size]=1`),
    fetchPage<JobApplicationAttributes>(`${config.teamtailor.apiUrl}/job-applications?page[size]=1`),
  ]);

  return {
    candidates: candidatesPage.meta['record-count'],
    applications: applicationsPage.meta['record-count'],
  };
}

export async function fetchAllCandidatesWithApplications(
  onProgress?: (candidatesProcessed: number, total: number) => void,
): Promise<FetchResult> {
  const baseUrl = `${config.teamtailor.apiUrl}/candidates?include=job-applications&page[size]=30`;

  // Step 1: Fetch first page to get total page count
  const firstPage = await fetchPage<CandidateAttributes>(baseUrl);
  const totalPages = firstPage.meta['page-count'];
  const totalCandidates = firstPage.meta['record-count'];

  console.log(`[Teamtailor] Starting parallel fetch: ${totalCandidates} candidates across ${totalPages} pages`);

  // Step 2: Generate URLs for remaining pages using page[number]
  const remainingUrls = Array.from({ length: totalPages - 1 }, (_, i) =>
    `${baseUrl}&page[number]=${i + 2}`
  );

  // Step 3: Fetch all pages in parallel with throttling (5 req/s max)
  const limit = pLimit(5);
  let completedPages = 1; // First page already fetched

  const allPages = await Promise.all([
    Promise.resolve(firstPage),
    ...remainingUrls.map((url) =>
      limit(async () => {
        const page = await fetchPage<CandidateAttributes>(url);
        completedPages++;
        onProgress?.(completedPages * 30, totalCandidates); // Approximate progress
        console.log(`[Teamtailor] Fetched page ${completedPages}/${totalPages}`);
        return page;
      })
    ),
  ]);

  // Step 4: Combine all candidates and deduplicate job-applications
  const candidates: CandidateResource[] = [];
  const allAppsById = new Map<string, JobApplicationResource>();

  for (const page of allPages) {
    candidates.push(...page.data);

    if (page.included) {
      for (const resource of page.included) {
        if (resource.type === 'job-applications') {
          allAppsById.set(resource.id, resource as JobApplicationResource);
        }
      }
    }
  }

  console.log(`[Teamtailor] Combined: ${candidates.length} candidates, ${allAppsById.size} applications`);

  // Step 5: Build lookup: candidate_id → JobApplicationResource[]
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
