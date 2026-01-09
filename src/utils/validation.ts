import { EXIT_CODES } from '../types/index.js';
import { CLIError } from './error.js';

/**
 * Regex for valid SQL identifiers (table names, column names).
 * Must start with letter or underscore, followed by alphanumeric or underscore.
 */
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Regex for valid project/worker names.
 * Alphanumeric, hyphens, and underscores only.
 */
const PROJECT_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * Regex for valid Cloudflare Worker names.
 * Wrangler only allows letters, digits, and hyphens (no underscores).
 */
const WORKER_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/**
 * Regex for valid FFmpeg resolution format (WIDTHxHEIGHT or -1:HEIGHT etc).
 */
const RESOLUTION_REGEX = /^(-?\d+):(-?\d+)$|^(\d+)x(\d+)$/;

/**
 * Regex for valid FFmpeg timestamp format (HH:MM:SS or seconds).
 */
const TIMESTAMP_REGEX = /^(\d{1,2}:)?(\d{1,2}:)?\d+(\.\d+)?$/;

/**
 * Regex for valid CRF quality value (0-51).
 */
const CRF_REGEX = /^\d{1,2}$/;

/**
 * Validate a SQL identifier (table name, column name).
 * @returns true if valid, false otherwise
 */
export function validateIdentifier(name: string): boolean {
  return IDENTIFIER_REGEX.test(name);
}

/**
 * Assert that a SQL identifier is valid, throwing CLIError if not.
 * @param name - The identifier to validate
 * @param type - The type of identifier for error messaging (e.g., "table name", "column name")
 */
export function assertValidIdentifier(name: string, type: string): void {
  if (!validateIdentifier(name)) {
    throw new CLIError(
      `Invalid ${type}: "${name}"`,
      EXIT_CODES.GENERAL_ERROR,
      `${type} must start with a letter or underscore, and contain only letters, numbers, and underscores.`,
    );
  }
}

/**
 * Validate a project or worker name.
 * @returns true if valid, false otherwise
 */
export function validateProjectName(name: string): boolean {
  return PROJECT_NAME_REGEX.test(name);
}

/**
 * Assert that a project name is valid, throwing CLIError if not.
 * @param name - The project name to validate
 */
export function assertValidProjectName(name: string): void {
  if (!validateProjectName(name)) {
    throw new CLIError(
      `Invalid project name: "${name}"`,
      EXIT_CODES.GENERAL_ERROR,
      'Project name must start with a letter and contain only letters, numbers, hyphens, and underscores.',
    );
  }
}

/**
 * Validate a Cloudflare Worker name.
 * Wrangler only allows letters, digits, and hyphens (no underscores).
 * @returns true if valid, false otherwise
 */
export function validateWorkerName(name: string): boolean {
  return WORKER_NAME_REGEX.test(name);
}

/**
 * Assert that a Cloudflare Worker name is valid, throwing CLIError if not.
 * @param name - The worker name to validate
 */
export function assertValidWorkerName(name: string): void {
  if (!validateWorkerName(name)) {
    throw new CLIError(
      `Invalid worker name: "${name}"`,
      EXIT_CODES.GENERAL_ERROR,
      'Worker name must start with a letter and contain only letters, numbers, and hyphens (no underscores).',
    );
  }
}

/**
 * Validate FFmpeg resolution format.
 * @returns true if valid, false otherwise
 */
export function validateResolution(size: string): boolean {
  return RESOLUTION_REGEX.test(size);
}

/**
 * Assert that a resolution is valid.
 */
export function assertValidResolution(size: string): void {
  if (!validateResolution(size)) {
    throw new CLIError(
      `Invalid resolution: "${size}"`,
      EXIT_CODES.GENERAL_ERROR,
      'Resolution must be in format WIDTHxHEIGHT (e.g., 1280x720) or SCALE:HEIGHT (e.g., -1:720).',
    );
  }
}

/**
 * Validate FFmpeg timestamp format.
 * @returns true if valid, false otherwise
 */
export function validateTimestamp(timestamp: string): boolean {
  return TIMESTAMP_REGEX.test(timestamp);
}

/**
 * Assert that a timestamp is valid.
 */
export function assertValidTimestamp(timestamp: string): void {
  if (!validateTimestamp(timestamp)) {
    throw new CLIError(
      `Invalid timestamp: "${timestamp}"`,
      EXIT_CODES.GENERAL_ERROR,
      'Timestamp must be in format HH:MM:SS, MM:SS, or seconds (e.g., 01:30:00, 90, 1:30).',
    );
  }
}

/**
 * Validate FFmpeg CRF quality value.
 * @returns true if valid (0-51), false otherwise
 */
export function validateCRF(quality: string): boolean {
  if (!CRF_REGEX.test(quality)) return false;
  const value = parseInt(quality, 10);
  return value >= 0 && value <= 51;
}

/**
 * Assert that a CRF quality value is valid.
 */
export function assertValidCRF(quality: string): void {
  if (!validateCRF(quality)) {
    throw new CLIError(
      `Invalid CRF quality: "${quality}"`,
      EXIT_CODES.GENERAL_ERROR,
      'CRF quality must be a number between 0 and 51 (lower = better quality).',
    );
  }
}
