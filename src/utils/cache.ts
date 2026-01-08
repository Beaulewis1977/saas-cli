import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import { getCacheDir } from './config.js';

let cacheInstance: Keyv | null = null;

/**
 * Default cache TTL (1 hour)
 */
const DEFAULT_TTL = 3600 * 1000;

/**
 * Initialize and get the cache instance
 */
export async function getCache(): Promise<Keyv> {
  if (cacheInstance) {
    return cacheInstance;
  }

  const cacheDir = getCacheDir();
  await mkdir(cacheDir, { recursive: true });

  const cachePath = join(cacheDir, 'cache.json');

  cacheInstance = new Keyv({
    store: new KeyvFile({ filename: cachePath }),
    namespace: 'saas-cli',
  });

  // Handle errors silently - cache failures shouldn't break the CLI
  cacheInstance.on('error', () => {
    // Silently ignore cache errors
  });

  return cacheInstance;
}

/**
 * Get a cached value
 */
export async function cacheGet<T>(key: string): Promise<T | undefined> {
  try {
    const cache = await getCache();
    return (await cache.get(key)) as T | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Set a cached value with optional TTL
 */
export async function cacheSet<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const cache = await getCache();
    await cache.set(key, value, ttl);
  } catch {
    // Silently ignore cache errors
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const cache = await getCache();
    await cache.delete(key);
  } catch {
    // Silently ignore cache errors
  }
}

/**
 * Clear all cached values
 */
export async function cacheClear(): Promise<void> {
  try {
    const cache = await getCache();
    await cache.clear();
  } catch {
    // Silently ignore cache errors
  }
}

/**
 * Generate a cache key from multiple parts
 */
export function cacheKey(...parts: string[]): string {
  return parts.map((p) => p.toLowerCase().replace(/\s+/g, '-')).join(':');
}

/**
 * Decorator to cache async function results
 */
export function withCache<T>(keyFn: (...args: unknown[]) => string, ttl: number = DEFAULT_TTL) {
  return (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<T>;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const key = keyFn(...args);

      // Try to get from cache
      const cached = await cacheGet<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cacheSet(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cached fetch helper - wraps a fetch function with caching
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
  skipCache = false,
): Promise<T> {
  if (!skipCache) {
    const cached = await cacheGet<T>(key);
    if (cached !== undefined) {
      return cached;
    }
  }

  const result = await fetchFn();
  await cacheSet(key, result, ttl);
  return result;
}
