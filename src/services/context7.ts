import type { Got } from 'got';
import { LIBRARY_IDS } from '../types/index.js';
import { cacheKey, cachedFetch } from '../utils/cache.js';
import { APIError } from '../utils/error.js';
import { createAuthenticatedClient } from './http.js';

const CONTEXT7_BASE_URL = 'https://context7.com/api/v2';

/**
 * Context7 API client for documentation lookup
 */
export class Context7Client {
  private client: Got;

  constructor(apiKey: string) {
    this.client = createAuthenticatedClient(CONTEXT7_BASE_URL, apiKey);
  }

  /**
   * Resolve a library name to its Context7 library ID
   */
  async resolveLibrary(libraryName: string, query: string): Promise<string> {
    // Check if we have a known mapping
    const normalizedName = libraryName.toLowerCase().replace(/-/g, '_');
    if (LIBRARY_IDS[normalizedName]) {
      return LIBRARY_IDS[normalizedName] as string;
    }

    // Search for the library
    try {
      const response = await this.client
        .get('libs/search', {
          searchParams: {
            libraryName,
            query,
          },
        })
        .json<{ results?: Array<{ libraryId: string; name: string }> }>();

      if (response.results && response.results.length > 0 && response.results[0]) {
        return response.results[0].libraryId;
      }

      // Fallback: try to construct a likely ID
      return `/${libraryName}/${libraryName}`;
    } catch (error) {
      // If search fails, try the fallback pattern
      return `/${libraryName}/${libraryName}`;
    }
  }

  /**
   * Query documentation for a specific library
   */
  async queryDocs(libraryId: string, query: string): Promise<string> {
    try {
      const response = await this.client
        .get('context', {
          searchParams: {
            libraryId,
            query,
            tokens: 8000,
          },
        })
        .text();

      // API returns markdown text directly
      if (!response || response.trim() === '') {
        return 'No documentation found for this query.';
      }

      return response;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { statusCode?: number } }).response;
        const statusCode = response?.statusCode;

        if (statusCode === 202) {
          throw new APIError(
            'Library is being indexed',
            'Context7',
            202,
            'The library is being indexed. Please try again in a few minutes.',
          );
        }

        if (statusCode === 404) {
          throw new APIError(
            'Library not found',
            'Context7',
            404,
            `Could not find library: ${libraryId}. Try a different package name.`,
          );
        }
      }

      throw error;
    }
  }

  /**
   * Search for documentation (combines resolve + query)
   */
  async search(library: string, query: string): Promise<string> {
    const key = cacheKey('context7', library, query);

    return cachedFetch(
      key,
      async () => {
        const libraryId = await this.resolveLibrary(library, query);
        return this.queryDocs(libraryId, query);
      },
      3600 * 1000, // 1 hour cache
    );
  }
}

// Singleton instance cache
let clientInstance: Context7Client | null = null;
let currentApiKey: string | null = null;

/**
 * Get or create a Context7 client instance
 */
export function getContext7Client(apiKey: string): Context7Client {
  if (!clientInstance || currentApiKey !== apiKey) {
    clientInstance = new Context7Client(apiKey);
    currentApiKey = apiKey;
  }
  return clientInstance;
}
