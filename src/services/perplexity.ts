import type { Got } from 'got';
import type { PerplexityAskOptions, PerplexityResponse } from '../types/index.js';
import { cacheKey, cachedFetch } from '../utils/cache.js';
import { createAuthenticatedClient } from './http.js';

const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

/**
 * Perplexity AI client for web-grounded questions
 */
export class PerplexityClient {
  private client: Got;

  constructor(apiKey: string) {
    this.client = createAuthenticatedClient(PERPLEXITY_BASE_URL, apiKey);
  }

  /**
   * Ask a question using Perplexity AI
   */
  async ask(query: string, options: PerplexityAskOptions = {}): Promise<string> {
    const model = options.model ?? 'sonar';

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant for software development questions. Be precise and include code examples when relevant. Focus on Flutter, Dart, and related technologies.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
      return_related_questions: false,
    };

    // Add optional filters
    if (options.searchRecencyFilter) {
      requestBody.search_recency_filter = options.searchRecencyFilter;
    }

    if (options.searchDomainFilter && options.searchDomainFilter.length > 0) {
      requestBody.search_domain_filter = options.searchDomainFilter;
    }

    const response = await this.client
      .post('chat/completions', {
        json: requestBody,
      })
      .json<PerplexityResponse>();

    return this.formatResponse(response, options.returnSources);
  }

  /**
   * Ask with caching enabled
   */
  async askCached(query: string, options: PerplexityAskOptions = {}): Promise<string> {
    const model = options.model ?? 'sonar';
    const key = cacheKey('perplexity', model, query);

    return cachedFetch(
      key,
      () => this.ask(query, options),
      1800 * 1000, // 30 minute cache for AI responses
    );
  }

  /**
   * Format the API response
   */
  private formatResponse(response: PerplexityResponse, includeSources?: boolean): string {
    const choice = response.choices[0];
    if (!choice) {
      return 'No response received from AI.';
    }

    let output = choice.message.content;

    // Add citations if requested
    if (includeSources && response.citations && response.citations.length > 0) {
      output += '\n\n---\nSources:\n';
      response.citations.forEach((url, i) => {
        output += `[${i + 1}] ${url}\n`;
      });
    }

    return output;
  }
}

// Singleton instance cache
let clientInstance: PerplexityClient | null = null;
let currentApiKey: string | null = null;

/**
 * Get or create a Perplexity client instance
 */
export function getPerplexityClient(apiKey: string): PerplexityClient {
  if (!clientInstance || currentApiKey !== apiKey) {
    clientInstance = new PerplexityClient(apiKey);
    currentApiKey = apiKey;
  }
  return clientInstance;
}
