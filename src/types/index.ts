/**
 * Global CLI configuration stored in ~/.config/saas-cli/config.yaml
 */
export interface GlobalConfig {
  context7?: {
    enabled?: boolean;
    apiKey?: string;
  };
  perplexity?: {
    apiKey?: string;
    defaultModel?: PerplexityModel;
  };
  supabase?: {
    projectRef?: string;
    url?: string;
    serviceKey?: string;
  };
  redis?: {
    url?: string;
  };
  cloudflare?: {
    accountId?: string;
    apiToken?: string;
  };
  onesignal?: {
    appId?: string;
    apiKey?: string;
  };
  posthog?: {
    projectId?: string;
    apiKey?: string;
  };
  defaults?: {
    outputFormat?: OutputFormat;
    cacheTtl?: number;
  };
}

/**
 * Project-level configuration stored in ./saas.yaml
 */
export interface ProjectConfig {
  project?: {
    name?: string;
    type?: 'flutter' | 'dart' | 'other';
  };
  flutter?: {
    path?: string;
  };
  supabase?: {
    path?: string;
    typesOutput?: string;
  };
  templates?: Record<string, { path: string }>;
}

/**
 * Output format options
 */
export type OutputFormat = 'pretty' | 'json' | 'minimal';

/**
 * Global CLI options available on all commands
 */
export interface GlobalOptions {
  json?: boolean;
  verbose?: boolean;
  debug?: boolean;
}

/**
 * Perplexity AI model options
 */
export type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning-pro' | 'sonar-deep-research';

/**
 * Model aliases for user-friendly names
 */
export const MODEL_ALIASES: Record<string, PerplexityModel> = {
  sonar: 'sonar',
  pro: 'sonar-pro',
  reasoning: 'sonar-reasoning-pro',
  deep: 'sonar-deep-research',
};

/**
 * Context7 library ID mapping for common Flutter/Dart packages
 */
export const LIBRARY_IDS: Record<string, string> = {
  flutter: '/websites/flutter_cn',
  dart: '/websites/dart_dev',
  riverpod: '/rrousselgit/riverpod',
  drift: '/simolus3/drift',
  go_router: '/websites/flutter_cn',
  gorouter: '/websites/flutter_cn',
  supabase: '/supabase/supabase-js',
  powersync: '/powersync-ja/powersync-js',
  freezed: '/rrousselgit/freezed',
  bloc: '/felangel/bloc',
  dio: '/cfug/dio',
  hive: '/isar/hive',
  isar: '/isar/isar',
  firebase: '/firebase/flutterfire',
};

/**
 * Context7 API response types
 */
export interface Context7SearchResult {
  libraryId: string;
  name?: string;
  description?: string;
}

export interface Context7DocsResult {
  content: string;
  source?: string;
  title?: string;
}

/**
 * Perplexity API response types
 */
export interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export interface PerplexityAskOptions {
  model?: PerplexityModel;
  maxTokens?: number;
  temperature?: number;
  searchRecencyFilter?: 'day' | 'week' | 'month' | 'year';
  searchDomainFilter?: string[];
  returnSources?: boolean;
}

/**
 * Column specification for code generation
 */
export interface ColumnSpec {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  isNullable?: boolean;
  defaultValue?: string;
  isAutoIncrement?: boolean;
}

/**
 * RLS policy types for Supabase
 */
export type RLSPolicyType = 'user-owned' | 'team-owned' | 'public-read' | 'admin-only';

/**
 * Command exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  USAGE_ERROR: 2,
  CONFIG_ERROR: 3,
  NETWORK_ERROR: 4,
  AUTH_ERROR: 5,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];
