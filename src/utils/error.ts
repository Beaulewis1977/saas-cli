import pc from 'picocolors';
import { EXIT_CODES, type ExitCode } from '../types/index.js';

/**
 * Custom CLI error with exit code and helpful hints
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: ExitCode = EXIT_CODES.GENERAL_ERROR,
    public hint?: string,
    public seeAlso?: string,
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * API-specific error with service context
 */
export class APIError extends CLIError {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    hint?: string,
  ) {
    super(message, EXIT_CODES.NETWORK_ERROR, hint);
    this.name = 'APIError';
  }
}

/**
 * Configuration error
 */
export class ConfigError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, EXIT_CODES.CONFIG_ERROR, hint);
    this.name = 'ConfigError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, EXIT_CODES.AUTH_ERROR, hint);
    this.name = 'AuthError';
  }
}

/**
 * Format error message for display
 */
function formatError(error: CLIError): string {
  const lines: string[] = [];

  // Main error message
  lines.push(pc.red(`Error: ${error.message}`));

  // Add hint if available
  if (error.hint) {
    lines.push(pc.yellow(`Hint: ${error.hint}`));
  }

  // Add see also if available
  if (error.seeAlso) {
    lines.push(pc.dim(`See: ${error.seeAlso}`));
  }

  return lines.join('\n');
}

/**
 * Handle errors and exit appropriately
 */
export function handleError(error: unknown): never {
  // Handle CLIError instances
  if (error instanceof CLIError) {
    console.error(formatError(error));

    // Show stack trace in debug mode
    if (process.env.DEBUG) {
      console.error(pc.dim('\nStack trace:'));
      console.error(pc.dim(error.stack ?? ''));
    }

    process.exit(error.exitCode);
  }

  // Handle standard errors
  if (error instanceof Error) {
    console.error(pc.red(`Error: ${error.message}`));

    if (process.env.DEBUG) {
      console.error(pc.dim('\nStack trace:'));
      console.error(pc.dim(error.stack ?? ''));
    }

    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  // Handle unknown errors
  console.error(pc.red('An unexpected error occurred'));
  console.error(pc.dim(String(error)));
  process.exit(EXIT_CODES.GENERAL_ERROR);
}

/**
 * Create an API error handler for a specific service
 */
export function createAPIErrorHandler(service: string) {
  return (error: unknown): never => {
    if (error instanceof APIError) {
      handleError(error);
    }

    // Handle got/HTTP errors
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { statusCode?: number; body?: unknown } }).response;
      const statusCode = response?.statusCode;

      let hint: string | undefined;

      switch (statusCode) {
        case 401:
          hint = `Check your ${service.toUpperCase()}_API_KEY environment variable`;
          break;
        case 403:
          hint = `Your API key may not have permission for this operation`;
          break;
        case 429:
          hint = `Rate limited. Wait a moment and try again`;
          break;
        case 404:
          hint = `Resource not found. Check if the library or endpoint exists`;
          break;
        case 500:
        case 502:
        case 503:
          hint = `${service} service is temporarily unavailable. Try again later`;
          break;
      }

      const apiError = new APIError(
        `${service} API request failed (${statusCode})`,
        service,
        statusCode,
        hint,
      );

      handleError(apiError);
    }

    // Re-throw as generic API error
    const message = error instanceof Error ? error.message : String(error);
    handleError(new APIError(message, service));
  };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return (await fn(...args)) as Awaited<ReturnType<T>>;
    } catch (error) {
      handleError(error);
    }
  };
}
