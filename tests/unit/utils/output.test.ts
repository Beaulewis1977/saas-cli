import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatBox,
  formatKeyValue,
  formatList,
  formatTable,
  isCI,
  maskSecret,
  shouldUseColor,
  truncate,
} from '../../../src/utils/output.js';

describe('output utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('shouldUseColor', () => {
    it('returns false when NO_COLOR is set', () => {
      process.env.NO_COLOR = '1';
      expect(shouldUseColor()).toBe(false);
    });
  });

  describe('isCI', () => {
    it('returns true when CI env is set', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('returns true when CONTINUOUS_INTEGRATION env is set', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';
      expect(isCI()).toBe(true);
    });

    it('returns false when neither is set', () => {
      delete process.env.CI;
      delete process.env.CONTINUOUS_INTEGRATION;
      expect(isCI()).toBe(false);
    });
  });

  describe('formatTable', () => {
    it('creates a table with headers and rows', () => {
      const result = formatTable(
        ['Name', 'Age'],
        [
          ['Alice', '30'],
          ['Bob', '25'],
        ],
      );
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('30');
      expect(result).toContain('25');
    });
  });

  describe('formatBox', () => {
    it('creates a boxed output with title', () => {
      const result = formatBox('Title', 'Content here');
      expect(result).toContain('Title');
      expect(result).toContain('Content here');
      expect(result).toContain('━');
    });
  });

  describe('formatKeyValue', () => {
    it('formats key-value pairs', () => {
      const result = formatKeyValue({ name: 'test', count: 42 });
      expect(result).toContain('name');
      expect(result).toContain('test');
      expect(result).toContain('count');
      expect(result).toContain('42');
    });

    it('filters out undefined values', () => {
      const result = formatKeyValue({ name: 'test', missing: undefined });
      expect(result).toContain('name');
      expect(result).not.toContain('missing');
    });
  });

  describe('formatList', () => {
    it('formats items as a bulleted list', () => {
      const result = formatList(['Item 1', 'Item 2', 'Item 3']);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
      expect(result).toContain('•');
    });

    it('supports custom bullets', () => {
      const result = formatList(['Item'], '-');
      expect(result).toContain('-');
    });
  });

  describe('truncate', () => {
    it('returns string unchanged if shorter than max', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates long strings with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });
  });

  describe('maskSecret', () => {
    it('masks secrets showing only first 4 chars', () => {
      // 16-char string -> 4 shown + 12 masked (min of length-4 and 20)
      expect(maskSecret('secret_key_12345')).toBe('secr************');
    });

    it('fully masks short secrets', () => {
      expect(maskSecret('abc')).toBe('****');
    });
  });
});
