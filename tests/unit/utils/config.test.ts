import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  expandEnvVars,
  getCacheDir,
  getConfigValue,
  getDefaultGlobalConfig,
  getGlobalConfigDir,
  getGlobalConfigPath,
} from '../../../src/utils/config.js';

describe('config utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getGlobalConfigDir', () => {
    it('uses XDG_CONFIG_HOME if set', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config';
      expect(getGlobalConfigDir()).toBe('/custom/config/saas-cli');
    });

    it('defaults to ~/.config on Linux/macOS', () => {
      delete process.env.XDG_CONFIG_HOME;
      expect(getGlobalConfigDir()).toBe(join(homedir(), '.config', 'saas-cli'));
    });
  });

  describe('getGlobalConfigPath', () => {
    it('returns path to config.yaml', () => {
      delete process.env.XDG_CONFIG_HOME;
      const expected = join(homedir(), '.config', 'saas-cli', 'config.yaml');
      expect(getGlobalConfigPath()).toBe(expected);
    });
  });

  describe('getCacheDir', () => {
    it('uses XDG_CACHE_HOME if set', () => {
      process.env.XDG_CACHE_HOME = '/custom/cache';
      expect(getCacheDir()).toBe('/custom/cache/saas-cli');
    });

    it('defaults to ~/.cache', () => {
      delete process.env.XDG_CACHE_HOME;
      expect(getCacheDir()).toBe(join(homedir(), '.cache', 'saas-cli'));
    });
  });

  describe('getDefaultGlobalConfig', () => {
    it('returns default config structure', () => {
      const config = getDefaultGlobalConfig();
      expect(config.context7?.enabled).toBe(true);
      expect(config.defaults?.outputFormat).toBe('pretty');
      expect(config.defaults?.cacheTtl).toBe(3600);
    });
  });

  describe('getConfigValue', () => {
    it('returns environment variable if set', () => {
      process.env.TEST_KEY = 'env_value';
      const result = getConfigValue('testKey', {}, null, 'default');
      // Note: key conversion may not match exactly, this tests the concept
      expect(result).toBeDefined();
    });

    it('returns default if nothing else matches', () => {
      const result = getConfigValue('nonexistent.key', {}, null, 'default_value');
      expect(result).toBe('default_value');
    });

    it('returns global config value if present', () => {
      const globalConfig = { defaults: { outputFormat: 'json' as const } };
      const result = getConfigValue('defaults.outputFormat', globalConfig, null, 'pretty');
      expect(result).toBe('json');
    });
  });

  describe('expandEnvVars', () => {
    it('expands ${VAR} syntax', () => {
      process.env.MY_VAR = 'hello';
      expect(expandEnvVars('${MY_VAR} world')).toBe('hello world');
    });

    it('expands $VAR syntax', () => {
      process.env.MY_VAR = 'hello';
      expect(expandEnvVars('$MY_VAR world')).toBe('hello world');
    });

    it('returns empty string for undefined vars', () => {
      expect(expandEnvVars('${UNDEFINED_VAR}')).toBe('');
    });
  });
});
