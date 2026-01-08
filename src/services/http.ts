import got, { type Got } from 'got';

/**
 * Default request options
 */
const defaultOptions = {
  timeout: {
    request: 30000,
  },
  retry: {
    limit: 3,
    methods: ['GET'] as ('GET' | 'POST' | 'PUT' | 'DELETE')[],
    statusCodes: [408, 429, 500, 502, 503, 504],
    errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'],
  },
  headers: {
    'User-Agent': 'saas-cli/1.0.0',
  },
};

/**
 * Create an HTTP client with default options
 */
export function createHttpClient(options: Record<string, unknown> = {}): Got {
  return got.extend({
    ...defaultOptions,
    ...options,
  });
}

/**
 * Create an authenticated HTTP client
 */
export function createAuthenticatedClient(
  baseUrl: string,
  apiKey: string,
  options: Record<string, unknown> = {},
): Got {
  return got.extend({
    ...defaultOptions,
    ...options,
    prefixUrl: baseUrl,
    headers: {
      ...defaultOptions.headers,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle rate limiting with exponential backoff
 */
export async function withRateLimitRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if rate limited
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { statusCode?: number } }).response?.statusCode === 429
      ) {
        // Get retry-after header or use exponential backoff
        const retryAfter = (error as { response?: { headers?: { 'retry-after'?: string } } })
          .response?.headers?.['retry-after'];
        const waitTime = retryAfter
          ? Number.parseInt(retryAfter, 10) * 1000
          : Math.pow(2, attempt) * 1000;

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Not a rate limit error, throw immediately
      throw error;
    }
  }

  throw lastError;
}
