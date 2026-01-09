import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { GlobalConfig, ProjectConfig } from '../types/index.js';
import { ConfigError } from './error.js';

/**
 * Get the global config directory path
 */
export function getGlobalConfigDir(): string {
  // Respect XDG_CONFIG_HOME on Linux
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return join(xdgConfig, 'saas-cli');
  }
  return join(homedir(), '.config', 'saas-cli');
}

/**
 * Get the global config file path
 */
export function getGlobalConfigPath(): string {
  return join(getGlobalConfigDir(), 'config.yaml');
}

/**
 * Get the cache directory path
 */
export function getCacheDir(): string {
  const xdgCache = process.env.XDG_CACHE_HOME;
  if (xdgCache) {
    return join(xdgCache, 'saas-cli');
  }
  return join(homedir(), '.cache', 'saas-cli');
}

/**
 * Load global configuration from ~/.config/saas-cli/config.yaml
 */
export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const configPath = getGlobalConfigPath();

  if (!existsSync(configPath)) {
    return getDefaultGlobalConfig();
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = parseYaml(content) as GlobalConfig;
    return { ...getDefaultGlobalConfig(), ...config };
  } catch (_error) {
    throw new ConfigError(
      `Failed to parse global config at ${configPath}`,
      'Check the YAML syntax in your config file',
    );
  }
}

/**
 * Save global configuration to ~/.config/saas-cli/config.yaml
 */
export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const configPath = getGlobalConfigPath();
  const configDir = dirname(configPath);

  try {
    await mkdir(configDir, { recursive: true, mode: 0o700 });
    const content = stringifyYaml(config as Record<string, unknown>);
    await writeFile(configPath, content, { mode: 0o600 });
  } catch (_error) {
    throw new ConfigError(
      `Failed to save global config to ${configPath}`,
      'Check file permissions',
    );
  }
}

/**
 * Load project configuration from ./saas.yaml
 */
export async function loadProjectConfig(searchPath?: string): Promise<ProjectConfig | null> {
  const startPath = searchPath ?? process.cwd();
  const configPath = join(startPath, 'saas.yaml');

  if (!existsSync(configPath)) {
    // Also check for saas.yml
    const altPath = join(startPath, 'saas.yml');
    if (!existsSync(altPath)) {
      return null;
    }
    return loadProjectConfigFromPath(altPath);
  }

  return loadProjectConfigFromPath(configPath);
}

/**
 * Load project config from a specific path
 */
async function loadProjectConfigFromPath(configPath: string): Promise<ProjectConfig> {
  try {
    const content = await readFile(configPath, 'utf-8');
    return parseYaml(content) as ProjectConfig;
  } catch (_error) {
    throw new ConfigError(
      `Failed to parse project config at ${configPath}`,
      'Check the YAML syntax in your saas.yaml file',
    );
  }
}

/**
 * Get default global configuration
 */
export function getDefaultGlobalConfig(): GlobalConfig {
  return {
    context7: {
      enabled: true,
    },
    defaults: {
      outputFormat: 'pretty',
      cacheTtl: 3600,
    },
  };
}

/**
 * Get a config value with environment variable override
 * Priority: env var > project config > global config > default
 */
export function getConfigValue<T>(
  key: string,
  globalConfig: GlobalConfig,
  projectConfig: ProjectConfig | null,
  defaultValue: T,
): T {
  // Check environment variable first (convert key to SCREAMING_SNAKE_CASE)
  const envKey = key
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    // Try to parse as JSON for complex types, fallback to string
    try {
      return JSON.parse(envValue) as T;
    } catch {
      return envValue as unknown as T;
    }
  }

  // Navigate nested keys
  const keys = key.split('.');

  // Check project config
  if (projectConfig) {
    const projectValue = getNestedValue(projectConfig as unknown as Record<string, unknown>, keys);
    if (projectValue !== undefined) {
      return projectValue as T;
    }
  }

  // Check global config
  const globalValue = getNestedValue(globalConfig as unknown as Record<string, unknown>, keys);
  if (globalValue !== undefined) {
    return globalValue as T;
  }

  return defaultValue;
}

/**
 * Get a nested value from an object using an array of keys
 */
function getNestedValue(obj: Record<string, unknown>, keys: string[]): unknown {
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Get API key from environment or config
 */
export function getAPIKey(
  service:
    | 'context7'
    | 'perplexity'
    | 'supabase'
    | 'redis'
    | 'cloudflare'
    | 'onesignal'
    | 'posthog',
  globalConfig: GlobalConfig,
): string | undefined {
  // Environment variable takes precedence
  const envMap: Record<string, string> = {
    context7: 'CONTEXT7_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    supabase: 'SUPABASE_SERVICE_KEY',
    redis: 'REDIS_URL',
    cloudflare: 'CF_API_TOKEN',
    onesignal: 'ONESIGNAL_API_KEY',
    posthog: 'POSTHOG_API_KEY',
  };

  const envKey = envMap[service];
  if (envKey && process.env[envKey]) {
    return process.env[envKey];
  }

  // Fallback to config
  const configValue = globalConfig[service];
  if (configValue && typeof configValue === 'object' && 'apiKey' in configValue) {
    return configValue.apiKey;
  }

  return undefined;
}

/**
 * Expand environment variables in a string
 * Supports ${VAR} and $VAR syntax
 */
export function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi, (_, braced, unbraced) => {
    const varName = braced || unbraced;
    return process.env[varName] ?? '';
  });
}
