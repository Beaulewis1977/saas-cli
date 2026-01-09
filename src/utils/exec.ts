import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/**
 * Promisified execFile for safe command execution.
 * Uses execFile instead of exec to prevent shell injection attacks.
 * Arguments are passed as an array, not concatenated into a shell command string.
 */
export const execFileAsync = promisify(execFile);

/**
 * Check if a command exists in the system PATH.
 * Uses 'which' on Unix-like systems and 'where' on Windows.
 *
 * @param command - The command name to check
 * @returns Promise<boolean> - true if command exists, false otherwise
 */
export async function commandExists(command: string): Promise<boolean> {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(checker, [command]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Assert that a command exists, throwing a helpful CLIError if not.
 *
 * @param command - The command name to check
 * @param displayName - Human-readable name for error messages
 * @param installHint - Installation instructions
 */
export async function assertCommandExists(
  command: string,
  displayName: string,
  installHint: string,
): Promise<void> {
  const exists = await commandExists(command);
  if (!exists) {
    // Import dynamically to avoid circular dependency
    const { CLIError } = await import('./error.js');
    const { EXIT_CODES } = await import('../types/index.js');
    throw new CLIError(`${displayName} not found`, EXIT_CODES.GENERAL_ERROR, installHint);
  }
}
