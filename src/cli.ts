import { createRequire } from 'node:module';
import { Command } from 'commander';
import pc from 'picocolors';
import { askCommand } from './commands/ask/index.js';
import { cfCommand } from './commands/cf/index.js';
// Import commands (will be added as we implement them)
import { docsCommand } from './commands/docs/index.js';
import { flagsCommand } from './commands/flags/index.js';
import { genCommand } from './commands/gen/index.js';
import { initCommand } from './commands/init/index.js';
import { pushCommand } from './commands/push/index.js';
import { redisCommand } from './commands/redis/index.js';
import { supabaseCommand } from './commands/supabase/index.js';
import { videoCommand } from './commands/video/index.js';
import { handleError } from './utils/error.js';

const require = createRequire(import.meta.url);
const { version: VERSION } = require('../package.json');

/**
 * Create and configure the CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('saas')
    .description('A unified CLI for Flutter SaaS development')
    .version(VERSION, '-V, --version', 'Display version number')
    .configureHelp({
      sortSubcommands: true,
      sortOptions: true,
    })
    .option('--json', 'Output results as JSON')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--debug', 'Enable debug output')
    .hook('preAction', (thisCommand) => {
      // Store global options for access in commands
      const opts = thisCommand.opts();
      process.env.SAAS_CLI_JSON = opts.json ? '1' : '';
      process.env.SAAS_CLI_VERBOSE = opts.verbose ? '1' : '';
      process.env.SAAS_CLI_DEBUG = opts.debug ? '1' : '';
    });

  // Register domain commands
  program.addCommand(docsCommand);
  program.addCommand(askCommand);
  program.addCommand(genCommand);
  program.addCommand(supabaseCommand);
  program.addCommand(redisCommand);
  program.addCommand(cfCommand);
  program.addCommand(pushCommand);
  program.addCommand(flagsCommand);
  program.addCommand(videoCommand);
  program.addCommand(initCommand);

  // Add examples to help
  program.addHelpText(
    'after',
    `
${pc.cyan('Examples:')}
  ${pc.dim('# Look up Flutter documentation')}
  $ saas docs flutter "ListView.builder with pagination"

  ${pc.dim('# Ask AI a question')}
  $ saas ask "best practices for offline-first Flutter apps"

  ${pc.dim('# Generate a Riverpod notifier')}
  $ saas gen riverpod notifier UserList --state "List<User>"

  ${pc.dim('# Generate RLS policies')}
  $ saas supabase rls recipes --policy user-owned --column user_id

  ${pc.dim('# Check feature flag status')}
  $ saas flags list

${pc.cyan('Documentation:')}
  https://github.com/your-username/saas-cli
`,
  );

  return program;
}

/**
 * Run the CLI
 */
export async function run(): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    handleError(error);
  }
}

export { createProgram };
