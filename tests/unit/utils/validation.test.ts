import { describe, expect, it } from 'vitest';
import { CLIError } from '../../../src/utils/error.js';
import {
  assertValidCRF,
  assertValidIdentifier,
  assertValidProjectName,
  assertValidResolution,
  assertValidTimestamp,
  assertValidWorkerName,
  validateCRF,
  validateIdentifier,
  validateProjectName,
  validateResolution,
  validateTimestamp,
  validateWorkerName,
} from '../../../src/utils/validation.js';

describe('validateIdentifier', () => {
  it('accepts valid SQL identifiers', () => {
    expect(validateIdentifier('users')).toBe(true);
    expect(validateIdentifier('user_id')).toBe(true);
    expect(validateIdentifier('_private')).toBe(true);
    expect(validateIdentifier('MyTable')).toBe(true);
    expect(validateIdentifier('table123')).toBe(true);
    expect(validateIdentifier('a')).toBe(true);
  });

  it('rejects invalid SQL identifiers', () => {
    expect(validateIdentifier('123users')).toBe(false);
    expect(validateIdentifier('user-id')).toBe(false);
    expect(validateIdentifier('user.id')).toBe(false);
    expect(validateIdentifier('user id')).toBe(false);
    expect(validateIdentifier('')).toBe(false);
    expect(validateIdentifier('table;drop')).toBe(false);
    expect(validateIdentifier("user's")).toBe(false);
    expect(validateIdentifier('table--')).toBe(false);
  });

  it('rejects SQL injection attempts', () => {
    expect(validateIdentifier('users; DROP TABLE users;--')).toBe(false);
    expect(validateIdentifier("users' OR '1'='1")).toBe(false);
    expect(validateIdentifier('users UNION SELECT * FROM passwords')).toBe(false);
  });
});

describe('assertValidIdentifier', () => {
  it('does not throw for valid identifiers', () => {
    expect(() => assertValidIdentifier('users', 'table name')).not.toThrow();
    expect(() => assertValidIdentifier('user_id', 'column name')).not.toThrow();
  });

  it('throws CLIError for invalid identifiers', () => {
    expect(() => assertValidIdentifier('user-id', 'column name')).toThrow(CLIError);
    expect(() => assertValidIdentifier('123table', 'table name')).toThrow(CLIError);
  });

  it('includes helpful error message', () => {
    expect(() => assertValidIdentifier('invalid-name', 'column name')).toThrow(CLIError);
    try {
      assertValidIdentifier('invalid-name', 'column name');
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as CLIError).message).toContain('Invalid column name');
      expect((error as CLIError).hint).toContain('must start with a letter or underscore');
    }
  });
});

describe('validateProjectName', () => {
  it('accepts valid project names', () => {
    expect(validateProjectName('my-app')).toBe(true);
    expect(validateProjectName('my_app')).toBe(true);
    expect(validateProjectName('myApp')).toBe(true);
    expect(validateProjectName('myapp123')).toBe(true);
    expect(validateProjectName('app')).toBe(true);
  });

  it('rejects invalid project names', () => {
    expect(validateProjectName('123app')).toBe(false);
    expect(validateProjectName('-myapp')).toBe(false);
    expect(validateProjectName('my app')).toBe(false);
    expect(validateProjectName('my.app')).toBe(false);
    expect(validateProjectName('')).toBe(false);
  });

  it('rejects command injection attempts', () => {
    expect(validateProjectName('myapp; echo pwned')).toBe(false);
    expect(validateProjectName('myapp$(whoami)')).toBe(false);
    expect(validateProjectName('myapp`rm -rf /`')).toBe(false);
    expect(validateProjectName('myapp | cat /etc/passwd')).toBe(false);
  });
});

describe('assertValidProjectName', () => {
  it('does not throw for valid project names', () => {
    expect(() => assertValidProjectName('my-app')).not.toThrow();
    expect(() => assertValidProjectName('my_app')).not.toThrow();
  });

  it('throws CLIError for invalid project names', () => {
    expect(() => assertValidProjectName('my app')).toThrow(CLIError);
    expect(() => assertValidProjectName('test; echo pwned')).toThrow(CLIError);
  });
});

describe('validateWorkerName', () => {
  it('accepts valid worker names (letters, digits, hyphens only)', () => {
    expect(validateWorkerName('my-worker')).toBe(true);
    expect(validateWorkerName('myWorker')).toBe(true);
    expect(validateWorkerName('worker123')).toBe(true);
    expect(validateWorkerName('api')).toBe(true);
  });

  it('rejects names with underscores (Wrangler does not allow them)', () => {
    expect(validateWorkerName('my_worker')).toBe(false);
    expect(validateWorkerName('my_app_worker')).toBe(false);
  });

  it('rejects other invalid worker names', () => {
    expect(validateWorkerName('123worker')).toBe(false);
    expect(validateWorkerName('-myworker')).toBe(false);
    expect(validateWorkerName('my worker')).toBe(false);
    expect(validateWorkerName('my.worker')).toBe(false);
    expect(validateWorkerName('')).toBe(false);
  });
});

describe('assertValidWorkerName', () => {
  it('does not throw for valid worker names', () => {
    expect(() => assertValidWorkerName('my-worker')).not.toThrow();
    expect(() => assertValidWorkerName('myWorker')).not.toThrow();
  });

  it('throws CLIError for names with underscores', () => {
    expect(() => assertValidWorkerName('my_worker')).toThrow(CLIError);
  });

  it('throws CLIError with helpful message', () => {
    try {
      assertValidWorkerName('my_worker');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CLIError);
      expect((error as CLIError).message).toContain('Invalid worker name');
      expect((error as CLIError).hint).toContain('no underscores');
    }
  });
});

describe('validateResolution', () => {
  it('accepts valid resolutions', () => {
    expect(validateResolution('1280x720')).toBe(true);
    expect(validateResolution('1920x1080')).toBe(true);
    expect(validateResolution('-1:720')).toBe(true);
    expect(validateResolution('1280:-1')).toBe(true);
  });

  it('rejects invalid resolutions', () => {
    expect(validateResolution('1280')).toBe(false);
    expect(validateResolution('abc')).toBe(false);
    expect(validateResolution('1280x')).toBe(false);
    expect(validateResolution('x720')).toBe(false);
    expect(validateResolution('1280x720;echo pwned')).toBe(false);
  });
});

describe('assertValidResolution', () => {
  it('does not throw for valid resolutions', () => {
    expect(() => assertValidResolution('1280x720')).not.toThrow();
    expect(() => assertValidResolution('-1:720')).not.toThrow();
  });

  it('throws CLIError for invalid resolutions', () => {
    expect(() => assertValidResolution('invalid')).toThrow(CLIError);
  });
});

describe('validateTimestamp', () => {
  it('accepts valid timestamps', () => {
    expect(validateTimestamp('01:30:00')).toBe(true);
    expect(validateTimestamp('1:30')).toBe(true);
    expect(validateTimestamp('90')).toBe(true);
    expect(validateTimestamp('90.5')).toBe(true);
    expect(validateTimestamp('00:00:01')).toBe(true);
  });

  it('rejects invalid timestamps', () => {
    expect(validateTimestamp('abc')).toBe(false);
    expect(validateTimestamp('')).toBe(false);
    expect(validateTimestamp('1:30:00;echo pwned')).toBe(false);
  });
});

describe('assertValidTimestamp', () => {
  it('does not throw for valid timestamps', () => {
    expect(() => assertValidTimestamp('01:30:00')).not.toThrow();
    expect(() => assertValidTimestamp('90')).not.toThrow();
  });

  it('throws CLIError for invalid timestamps', () => {
    expect(() => assertValidTimestamp('invalid')).toThrow(CLIError);
  });
});

describe('validateCRF', () => {
  it('accepts valid CRF values', () => {
    expect(validateCRF('0')).toBe(true);
    expect(validateCRF('23')).toBe(true);
    expect(validateCRF('51')).toBe(true);
  });

  it('rejects invalid CRF values', () => {
    expect(validateCRF('52')).toBe(false);
    expect(validateCRF('-1')).toBe(false);
    expect(validateCRF('abc')).toBe(false);
    expect(validateCRF('23;echo pwned')).toBe(false);
  });
});

describe('assertValidCRF', () => {
  it('does not throw for valid CRF values', () => {
    expect(() => assertValidCRF('23')).not.toThrow();
  });

  it('throws CLIError for invalid CRF values', () => {
    expect(() => assertValidCRF('100')).toThrow(CLIError);
  });
});
