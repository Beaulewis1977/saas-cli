import { describe, expect, it } from 'vitest';
import { CLIError } from '../../../src/utils/error.js';
import { assertCommandExists, commandExists } from '../../../src/utils/exec.js';

describe('exec utilities', () => {
  describe('commandExists', () => {
    it('should return true for a command that exists', async () => {
      // 'node' should always exist in our test environment
      const exists = await commandExists('node');
      expect(exists).toBe(true);
    });

    it('should return false for a command that does not exist', async () => {
      const exists = await commandExists('nonexistent-command-xyz-12345');
      expect(exists).toBe(false);
    });

    it('should return true for common shell commands', async () => {
      // Use platform-appropriate command
      const command = process.platform === 'win32' ? 'cmd' : 'ls';
      const exists = await commandExists(command);
      expect(exists).toBe(true);
    });
  });

  describe('assertCommandExists', () => {
    it('should not throw for a command that exists', async () => {
      await expect(
        assertCommandExists('node', 'Node.js', 'Install Node.js from https://nodejs.org'),
      ).resolves.toBeUndefined();
    });

    it('should throw CLIError for a command that does not exist', async () => {
      await expect(
        assertCommandExists(
          'nonexistent-command-xyz-12345',
          'Test CLI',
          'Install Test CLI: npm install -g test-cli',
        ),
      ).rejects.toThrow('Test CLI not found');
    });

    it('should include the install hint in the error', async () => {
      try {
        await assertCommandExists(
          'nonexistent-command-xyz-12345',
          'Flutter SDK',
          'Install Flutter: https://docs.flutter.dev/get-started/install',
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CLIError);
        expect((error as CLIError).message).toContain('Flutter SDK not found');
        expect((error as CLIError).hint).toBe(
          'Install Flutter: https://docs.flutter.dev/get-started/install',
        );
      }
    });
  });
});
