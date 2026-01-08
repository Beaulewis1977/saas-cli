import { exec } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execAsync = promisify(exec);
const CLI_PATH = join(process.cwd(), 'bin', 'saas.js');

async function runCLI(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(`node ${CLI_PATH} ${args}`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.code || 1,
    };
  }
}

describe('CLI integration tests', () => {
  describe('basic commands', () => {
    it('shows version', async () => {
      const { stdout, exitCode } = await runCLI('--version');
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('shows help', async () => {
      const { stdout, exitCode } = await runCLI('--help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('A unified CLI for Flutter SaaS development');
      expect(stdout).toContain('docs');
      expect(stdout).toContain('gen');
      expect(stdout).toContain('supabase');
    });
  });

  describe('docs command', () => {
    it('shows docs help', async () => {
      const { stdout, exitCode } = await runCLI('docs --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('flutter');
      expect(stdout).toContain('dart');
      expect(stdout).toContain('package');
      expect(stdout).toContain('widget');
    });
  });

  describe('gen command', () => {
    it('shows gen help', async () => {
      const { stdout, exitCode } = await runCLI('gen --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('riverpod');
      expect(stdout).toContain('drift');
      expect(stdout).toContain('gorouter');
      expect(stdout).toContain('freezed');
    });

    it('generates riverpod notifier', async () => {
      const { stdout, exitCode } = await runCLI(
        'gen riverpod notifier UserList --state "List<User>"',
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('@riverpod');
      expect(stdout).toContain('class UserListNotifier');
      expect(stdout).toContain('List<User>');
    });

    it('generates freezed model', async () => {
      const { stdout, exitCode } = await runCLI(
        'gen freezed User --fields "id:String,name:String,email:String?"',
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('@freezed');
      expect(stdout).toContain('class User');
      expect(stdout).toContain('required String id');
      expect(stdout).toContain('String? email');
    });
  });

  describe('supabase command', () => {
    it('shows supabase help', async () => {
      const { stdout, exitCode } = await runCLI('supabase --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('schema');
      expect(stdout).toContain('create-table');
      expect(stdout).toContain('rls');
      expect(stdout).toContain('migration');
    });

    it('generates RLS policies', async () => {
      const { stdout, exitCode } = await runCLI(
        'supabase rls recipes --policy user-owned --column user_id',
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('RLS Policies');
      expect(stdout).toContain('auth.uid()');
      expect(stdout).toContain('user_id');
    });

    it('generates create table SQL', async () => {
      const { stdout, exitCode } = await runCLI(
        'supabase create-table users --columns "id:uuid:pk,name:text,email:text"',
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain('CREATE TABLE');
      expect(stdout).toContain('users');
    });
  });

  describe('redis command', () => {
    it('shows redis help', async () => {
      const { stdout, exitCode } = await runCLI('redis --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('ping');
      expect(stdout).toContain('queue');
      expect(stdout).toContain('keys');
    });
  });

  describe('video command', () => {
    it('shows video help', async () => {
      const { stdout, exitCode } = await runCLI('video --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('info');
      expect(stdout).toContain('combine');
      expect(stdout).toContain('thumbnail');
      expect(stdout).toContain('resize');
      expect(stdout).toContain('compress');
      expect(stdout).toContain('trim');
    });
  });

  describe('init command', () => {
    it('shows init help', async () => {
      const { stdout, exitCode } = await runCLI('init --help');
      expect(exitCode).toBe(0);
      expect(stdout).toContain('flutter');
      expect(stdout).toContain('supabase');
      expect(stdout).toContain('worker');
      expect(stdout).toContain('add');
    });
  });
});
