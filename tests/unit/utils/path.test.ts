import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLIError } from '../../../src/utils/error.js';
import { validateOutputPath } from '../../../src/utils/path.js';

describe('validateOutputPath', () => {
  const baseDir = process.cwd();

  it('accepts paths within the base directory', () => {
    expect(() => validateOutputPath('output.ts')).not.toThrow();
    expect(() => validateOutputPath('./output.ts')).not.toThrow();
    expect(() => validateOutputPath('lib/output.ts')).not.toThrow();
    expect(() => validateOutputPath('./lib/output.ts')).not.toThrow();
  });

  it('returns normalized absolute path', () => {
    const result = validateOutputPath('lib/output.ts');
    expect(result).toBe(resolve(baseDir, 'lib/output.ts'));
  });

  it('rejects path traversal attempts', () => {
    expect(() => validateOutputPath('../output.ts')).toThrow(CLIError);
    expect(() => validateOutputPath('../../output.ts')).toThrow(CLIError);
    expect(() => validateOutputPath('../../../etc/passwd')).toThrow(CLIError);
    expect(() => validateOutputPath('lib/../../output.ts')).toThrow(CLIError);
  });

  it('rejects absolute paths outside base directory', () => {
    expect(() => validateOutputPath('/etc/passwd')).toThrow(CLIError);
    expect(() => validateOutputPath('/tmp/output.ts')).toThrow(CLIError);
  });

  it('provides helpful error message', () => {
    expect(() => validateOutputPath('../output.ts')).toThrow(CLIError);
    try {
      validateOutputPath('../output.ts');
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as CLIError).message).toContain('escapes project directory');
      expect((error as CLIError).hint).toContain('must be within the current project directory');
    }
  });

  it('handles complex path traversal attempts', () => {
    expect(() => validateOutputPath('./lib/../../../etc/passwd')).toThrow(CLIError);
    expect(() => validateOutputPath('lib/subdir/../../..')).toThrow(CLIError);
  });

  it('accepts nested paths within base directory', () => {
    expect(() => validateOutputPath('lib/features/auth/output.ts')).not.toThrow();
    expect(() => validateOutputPath('./src/generated/types.ts')).not.toThrow();
  });

  it('works with custom base directory', () => {
    const customBase = '/tmp/project';
    expect(() => validateOutputPath('output.ts', customBase)).not.toThrow();
    expect(() => validateOutputPath('../output.ts', customBase)).toThrow(CLIError);
  });
});
