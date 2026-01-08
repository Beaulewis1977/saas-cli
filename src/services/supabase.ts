import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { CLIError } from '../utils/error.js';

const execAsync = promisify(exec);

/**
 * Check if Supabase CLI is installed
 */
export async function checkSupabaseCLI(): Promise<boolean> {
  try {
    await execAsync('supabase --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a Supabase CLI command
 */
export async function runSupabaseCommand(args: string[]): Promise<string> {
  const isInstalled = await checkSupabaseCLI();
  if (!isInstalled) {
    throw new CLIError(
      'Supabase CLI not found',
      1,
      'Install with: brew install supabase/tap/supabase',
    );
  }

  try {
    const { stdout, stderr } = await execAsync(`supabase ${args.join(' ')}`);
    if (stderr && !stderr.includes('warning')) {
      console.error(stderr);
    }
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CLIError(`Supabase command failed: ${message}`);
  }
}

/**
 * Get database schema
 */
export async function getSchema(tableName?: string): Promise<string> {
  const args = ['db', 'dump', '--schema', 'public'];
  if (tableName) {
    args.push('--data-only', '--table', tableName);
  }
  return runSupabaseCommand(args);
}

/**
 * Generate TypeScript types
 */
export async function generateTypes(outputPath?: string): Promise<string> {
  const args = ['gen', 'types', 'typescript', '--local'];
  const output = await runSupabaseCommand(args);

  if (outputPath) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(outputPath, output);
  }

  return output;
}

/**
 * RLS policy templates
 */
export const RLS_POLICIES = {
  'user-owned': (table: string, column: string) => `
-- RLS Policies for ${table} (user-owned)

-- Enable RLS
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own ${table}"
  ON ${table} FOR SELECT
  USING (auth.uid() = ${column});

-- Users can create their own records
CREATE POLICY "Users can create own ${table}"
  ON ${table} FOR INSERT
  WITH CHECK (auth.uid() = ${column});

-- Users can update their own records
CREATE POLICY "Users can update own ${table}"
  ON ${table} FOR UPDATE
  USING (auth.uid() = ${column});

-- Users can delete their own records
CREATE POLICY "Users can delete own ${table}"
  ON ${table} FOR DELETE
  USING (auth.uid() = ${column});
`,

  'team-owned': (table: string, teamColumn: string) => `
-- RLS Policies for ${table} (team-owned)

-- Enable RLS
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

-- Team members can view team records
CREATE POLICY "Team members can view ${table}"
  ON ${table} FOR SELECT
  USING (
    ${teamColumn} IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can create team records
CREATE POLICY "Team members can create ${table}"
  ON ${table} FOR INSERT
  WITH CHECK (
    ${teamColumn} IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team members can update team records
CREATE POLICY "Team members can update ${table}"
  ON ${table} FOR UPDATE
  USING (
    ${teamColumn} IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team admins can delete team records
CREATE POLICY "Team admins can delete ${table}"
  ON ${table} FOR DELETE
  USING (
    ${teamColumn} IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
`,

  'public-read': (table: string) => `
-- RLS Policies for ${table} (public-read)

-- Enable RLS
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

-- Anyone can view records
CREATE POLICY "Anyone can view ${table}"
  ON ${table} FOR SELECT
  USING (true);

-- Only authenticated users can create records
CREATE POLICY "Authenticated users can create ${table}"
  ON ${table} FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only owners can update their records
CREATE POLICY "Owners can update ${table}"
  ON ${table} FOR UPDATE
  USING (auth.uid() = user_id);

-- Only owners can delete their records
CREATE POLICY "Owners can delete ${table}"
  ON ${table} FOR DELETE
  USING (auth.uid() = user_id);
`,

  'admin-only': (table: string) => `
-- RLS Policies for ${table} (admin-only)

-- Enable RLS
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

-- Only admins can view records
CREATE POLICY "Admins can view ${table}"
  ON ${table} FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Only admins can create records
CREATE POLICY "Admins can create ${table}"
  ON ${table} FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Only admins can update records
CREATE POLICY "Admins can update ${table}"
  ON ${table} FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );

-- Only admins can delete records
CREATE POLICY "Admins can delete ${table}"
  ON ${table} FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM admins)
  );
`,
};

export type RLSPolicyType = keyof typeof RLS_POLICIES;
