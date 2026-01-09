import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get the templates directory path
 */
export function getTemplatesDir(): string {
  // Try project root first (development)
  const devPath = join(__dirname, '..', '..', 'templates');
  if (existsSync(devPath)) {
    return devPath;
  }

  // Try dist location (production)
  const prodPath = join(__dirname, '..', 'templates');
  if (existsSync(prodPath)) {
    return prodPath;
  }

  return devPath;
}

// Register Handlebars helpers
Handlebars.registerHelper('camelCase', (str: string) => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
});

Handlebars.registerHelper('pascalCase', (str: string) => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
});

Handlebars.registerHelper('snakeCase', (str: string) => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
});

Handlebars.registerHelper('kebabCase', (str: string) => {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/^-/, '');
});

Handlebars.registerHelper('upperCase', (str: string) => str.toUpperCase());

Handlebars.registerHelper('lowerCase', (str: string) => str.toLowerCase());

Handlebars.registerHelper('singularize', (str: string) => {
  // Simple singularization
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('es')) return str.slice(0, -2);
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
});

Handlebars.registerHelper('pluralize', (str: string) => {
  // Simple pluralization
  if (str.endsWith('y')) return str.slice(0, -1) + 'ies';
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
});

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('or', (a: unknown, b: unknown) => a || b);
Handlebars.registerHelper('and', (a: unknown, b: unknown) => a && b);

// Date helper
Handlebars.registerHelper('now', () => new Date().toISOString().split('T')[0]);

// Type mapping helpers for Drift/Dart
Handlebars.registerHelper('dartType', (sqlType: string) => {
  const typeMap: Record<string, string> = {
    int: 'int',
    integer: 'int',
    bigint: 'int',
    text: 'String',
    varchar: 'String',
    bool: 'bool',
    boolean: 'bool',
    real: 'double',
    double: 'double',
    float: 'double',
    blob: 'Uint8List',
    datetime: 'DateTime',
    timestamptz: 'DateTime',
    timestamp: 'DateTime',
    uuid: 'String',
    json: 'Map<String, dynamic>',
    jsonb: 'Map<String, dynamic>',
  };
  return typeMap[sqlType.toLowerCase()] || 'String';
});

Handlebars.registerHelper('driftColumn', (sqlType: string) => {
  const columnMap: Record<string, string> = {
    int: 'integer',
    integer: 'integer',
    bigint: 'int64',
    text: 'text',
    varchar: 'text',
    bool: 'boolean',
    boolean: 'boolean',
    real: 'real',
    double: 'real',
    float: 'real',
    blob: 'blob',
    datetime: 'dateTime',
    timestamptz: 'dateTime',
    timestamp: 'dateTime',
    uuid: 'text',
    json: 'text',
    jsonb: 'text',
  };
  return columnMap[sqlType.toLowerCase()] || 'text';
});

/**
 * Template cache for compiled templates
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Load and compile a template
 */
export async function loadTemplate(
  category: string,
  name: string,
): Promise<HandlebarsTemplateDelegate> {
  const cacheKey = `${category}/${name}`;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  const templatesDir = getTemplatesDir();
  const templatePath = join(templatesDir, category, `${name}.hbs`);

  try {
    const content = await readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(content);
    templateCache.set(cacheKey, compiled);
    return compiled;
  } catch (_error) {
    throw new Error(`Template not found: ${category}/${name}.hbs`);
  }
}

/**
 * Render a template with context
 */
export async function renderTemplate(
  category: string,
  name: string,
  context: Record<string, unknown>,
): Promise<string> {
  const template = await loadTemplate(category, name);
  return template(context);
}

/**
 * List available templates in a category
 */
export async function listTemplates(category: string): Promise<string[]> {
  const templatesDir = getTemplatesDir();
  const categoryDir = join(templatesDir, category);

  try {
    const files = await readdir(categoryDir);
    return files.filter((f) => f.endsWith('.hbs')).map((f) => f.replace('.hbs', ''));
  } catch {
    return [];
  }
}

/**
 * Render an inline template string
 */
export function renderInline(template: string, context: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template);
  return compiled(context);
}

export { Handlebars };
