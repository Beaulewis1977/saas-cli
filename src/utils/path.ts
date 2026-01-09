import { isAbsolute, normalize, relative, resolve } from 'node:path';
import { EXIT_CODES } from '../types/index.js';
import { CLIError } from './error.js';

/**
 * Validate and normalize an output file path, preventing path traversal attacks.
 * Ensures the output path is within the specified base directory (defaults to cwd).
 *
 * @param userPath - The user-provided output path
 * @param baseDir - The base directory to restrict output to (defaults to process.cwd())
 * @returns The normalized absolute path if valid
 * @throws CLIError if the path escapes the base directory
 */
export function validateOutputPath(userPath: string, baseDir: string = process.cwd()): string {
  // Normalize and resolve the path
  const normalizedBase = normalize(resolve(baseDir));
  const normalizedPath = normalize(resolve(baseDir, userPath));

  // Check if the resolved path is within the base directory
  const relativePath = relative(normalizedBase, normalizedPath);

  // If relative path starts with '..' or is absolute, it escapes the base
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new CLIError(
      `Output path escapes project directory: "${userPath}"`,
      EXIT_CODES.GENERAL_ERROR,
      'Output path must be within the current project directory. Use relative paths like "./lib/output.dart".',
    );
  }

  return normalizedPath;
}
