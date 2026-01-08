import Table from 'cli-table3';
import pc from 'picocolors';
import type { GlobalOptions, OutputFormat } from '../types/index.js';

/**
 * Check if colors should be disabled
 */
export function shouldUseColor(): boolean {
  return !process.env.NO_COLOR && process.stdout.isTTY !== false;
}

/**
 * Check if we're in a CI environment
 */
export function isCI(): boolean {
  return Boolean(process.env.CI || process.env.CONTINUOUS_INTEGRATION);
}

/**
 * Output data in the appropriate format
 */
export function output(data: unknown, options: GlobalOptions = {}, format?: OutputFormat): void {
  const outputFormat = options.json ? 'json' : (format ?? 'pretty');

  switch (outputFormat) {
    case 'json':
      console.log(JSON.stringify(data, null, 2));
      break;
    case 'minimal':
      if (typeof data === 'string') {
        console.log(data);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    default:
      if (typeof data === 'string') {
        console.log(data);
      } else {
        console.log(data);
      }
      break;
  }
}

/**
 * Log an info message
 */
export function log(message: string): void {
  console.log(message);
}

/**
 * Log a success message
 */
export function success(message: string): void {
  console.log(pc.green(message));
}

/**
 * Log a warning message
 */
export function warn(message: string): void {
  console.error(pc.yellow(`Warning: ${message}`));
}

/**
 * Log a verbose message (only shown with --verbose)
 */
export function verbose(message: string, options: GlobalOptions = {}): void {
  if (options.verbose) {
    console.log(pc.dim(message));
  }
}

/**
 * Log a debug message (only shown with --debug or DEBUG env)
 */
export function debug(message: string, options: GlobalOptions = {}): void {
  if (options.debug || process.env.DEBUG) {
    console.log(pc.dim(`[debug] ${message}`));
  }
}

/**
 * Format a table for display
 */
export function formatTable(
  headers: string[],
  rows: string[][],
  options: { head?: boolean } = {},
): string {
  const table = new Table({
    head: options.head !== false ? headers.map((h) => pc.cyan(h)) : undefined,
    style: {
      head: [],
      border: [],
    },
  });

  for (const row of rows) {
    table.push(row);
  }
  return table.toString();
}

/**
 * Format a box with title and content
 */
export function formatBox(title: string, content: string): string {
  const line = '━'.repeat(70);
  const lines: string[] = [
    pc.cyan(line),
    pc.cyan(pc.bold(title)),
    pc.cyan(line),
    '',
    content,
    '',
    pc.cyan(line),
  ];
  return lines.join('\n');
}

/**
 * Format a key-value list
 */
export function formatKeyValue(
  items: Record<string, string | number | boolean | undefined>,
): string {
  const maxKeyLength = Math.max(...Object.keys(items).map((k) => k.length));

  return Object.entries(items)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      return `${pc.cyan(paddedKey)}  ${value}`;
    })
    .join('\n');
}

/**
 * Format a code block with optional language
 */
export function formatCode(code: string, language?: string): string {
  const header = language ? pc.dim(`// ${language}`) : '';
  const formattedCode = code
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

  return header ? `${header}\n${formattedCode}` : formattedCode;
}

/**
 * Format a list of items with bullets
 */
export function formatList(items: string[], bullet = '•'): string {
  return items.map((item) => `${pc.cyan(bullet)} ${item}`).join('\n');
}

/**
 * Format a section header
 */
export function formatHeader(title: string): string {
  return pc.cyan(pc.bold(`\n${title}\n`));
}

/**
 * Create a spinner-compatible logger that respects output options
 */
export function createLogger(options: GlobalOptions = {}) {
  return {
    log: (msg: string) => log(msg),
    success: (msg: string) => success(msg),
    warn: (msg: string) => warn(msg),
    verbose: (msg: string) => verbose(msg, options),
    debug: (msg: string) => debug(msg, options),
  };
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Mask sensitive values (show first 4 chars only)
 */
export function maskSecret(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 20));
}
