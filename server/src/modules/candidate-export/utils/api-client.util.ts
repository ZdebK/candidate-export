import { config } from '../../../shared/config/env.config';
import { withRetry, sleep } from '../../../shared/utils/retry.util';
import { logger } from '../../../shared/utils/logger.util';
import type { JsonApiResponse, JsonApiAttributes } from '../types/teamtailor.types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_HEADERS = {
  Authorization: `Token token=${config.teamtailor.apiKey}`,
  'X-Api-Version': config.teamtailor.apiVersion,
  'Content-Type': 'application/vnd.api+json',
};

async function fetchWithTimeout(url: string, timeoutMs = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T extends JsonApiAttributes>(
  response: Response,
): Promise<JsonApiResponse<T>> {
  if (response.status === 401) {
    throw new ApiError(
      'Unable to connect to Teamtailor API. Please check your API key configuration.',
      401,
      'UNAUTHORIZED',
    );
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5_000;
    await sleep(waitMs);
    throw new ApiError('Rate limit exceeded', 429, 'RATE_LIMITED');
  }

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
      'API_ERROR',
    );
  }

  try {
    return (await response.json()) as JsonApiResponse<T>;
  } catch {
    throw new ApiError('Data format error. Please contact support.', 0, 'PARSE_ERROR');
  }
}

export async function fetchPage<T extends JsonApiAttributes>(
  url: string,
): Promise<JsonApiResponse<T>> {
  return withRetry(
    async () => {
      const response = await fetchWithTimeout(url);
      return handleResponse<T>(response);
    },
    {
      maxRetries: config.export.maxRetries,
      baseDelayMs: 1_000,
      onRetry: (attempt, error) => {
        logger.warn(`API retry attempt ${attempt}/${config.export.maxRetries}`, { error: error.message });
      },
    },
  );
}

export async function* paginatedFetch<T extends JsonApiAttributes>(
  startUrl: string,
): AsyncGenerator<JsonApiResponse<T>> {
  let nextUrl: string | null | undefined = startUrl;

  while (nextUrl) {
    const page: JsonApiResponse<T> = await fetchPage<T>(nextUrl);
    yield page;

    nextUrl = page.links?.next ?? null;

    if (nextUrl) {
      await sleep(config.export.delayMs);
    }
  }
}
