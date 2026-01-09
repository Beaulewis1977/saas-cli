import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { RLS_POLICIES, type RLSPolicyType, runSupabaseCommand } from '../../services/supabase.js';
import { columnsToSQL, parseColumnSpec } from '../../utils/column-parser.js';
import { CLIError, handleError } from '../../utils/error.js';
import { validateOutputPath } from '../../utils/path.js';
import { assertValidProjectName } from '../../utils/validation.js';

export const supabaseCommand = new Command('supabase')
  .description('Supabase database management')
  .addCommand(
    new Command('schema')
      .description('Show database schema')
      .argument('[table]', 'Specific table name')
      .option('--rls', 'Include RLS policies')
      .option('--relationships', 'Show foreign key relationships')
      .action(async (_table, _options) => {
        const spinner = ora('Fetching schema...').start();
        try {
          const output = await runSupabaseCommand(['db', 'dump', '--schema', 'public', '-f', '-']);
          spinner.stop();
          console.log(output);
        } catch (error) {
          spinner.fail('Failed to fetch schema');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('create-table')
      .description('Generate CREATE TABLE SQL')
      .argument('<name>', 'Table name')
      .option('-c, --columns <spec>', 'Column specification')
      .option('--from-freezed <file>', 'Generate from Freezed model file')
      .action(async (name, options) => {
        try {
          if (!options.columns) {
            throw new CLIError(
              'Columns specification required',
              1,
              'Use --columns "id:uuid:pk,title:text,user_id:uuid:fk(auth.users)"',
            );
          }

          const columns = parseColumnSpec(options.columns);
          const sql = columnsToSQL(name, columns);

          console.log(pc.cyan('-- Migration: create_' + name + '_table'));
          console.log(sql);
          console.log('\n-- Enable RLS');
          console.log(`ALTER TABLE ${name} ENABLE ROW LEVEL SECURITY;`);
        } catch (error) {
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('rls')
      .description('Generate RLS policies')
      .argument('<table>', 'Table name')
      .option(
        '-p, --policy <type>',
        'Policy type: user-owned, team-owned, public-read, admin-only',
        'user-owned',
      )
      .option('-c, --column <name>', 'User/team ID column', 'user_id')
      .action(async (table, options) => {
        try {
          const policyType = options.policy as RLSPolicyType;
          if (!RLS_POLICIES[policyType]) {
            throw new CLIError(
              `Invalid policy type: "${policyType}"`,
              1,
              'Valid types: user-owned, team-owned, public-read, admin-only',
            );
          }

          const sql = RLS_POLICIES[policyType](table, options.column);
          console.log(sql);
        } catch (error) {
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('migration')
      .description('Migration management')
      .argument('<action>', 'Action: new, apply, status')
      .argument('[name]', 'Migration name (for new)')
      .action(async (action, name) => {
        const spinner = ora(`Running migration ${action}...`).start();
        try {
          let args: string[];
          switch (action) {
            case 'new':
              if (!name) {
                throw new CLIError('Migration name required for "new" action');
              }
              assertValidProjectName(name);
              args = ['migration', 'new', name];
              break;
            case 'apply':
              args = ['db', 'push'];
              break;
            case 'status':
              args = ['migration', 'list'];
              break;
            default:
              throw new CLIError(
                `Invalid action: "${action}"`,
                1,
                'Valid actions: new, apply, status',
              );
          }

          const output = await runSupabaseCommand(args);
          spinner.stop();
          console.log(output);
        } catch (error) {
          spinner.fail(`Migration ${action} failed`);
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('types')
      .description('Generate TypeScript/Dart types')
      .argument('<lang>', 'Language: dart, typescript')
      .option('-o, --output <path>', 'Output file path')
      .action(async (lang, options) => {
        const spinner = ora(`Generating ${lang} types...`).start();
        try {
          let args: string[];
          switch (lang) {
            case 'dart':
            case 'typescript':
              args = ['gen', 'types', lang, '--local'];
              break;
            default:
              throw new CLIError(
                `Invalid language: "${lang}"`,
                1,
                'Valid languages: dart, typescript',
              );
          }

          const output = await runSupabaseCommand(args);
          spinner.stop();

          if (options.output) {
            const safePath = validateOutputPath(options.output);
            const { writeFile } = await import('node:fs/promises');
            await writeFile(safePath, output);
            console.log(pc.green(`✓ Generated ${safePath}`));
          } else {
            console.log(output);
          }
        } catch (error) {
          spinner.fail('Type generation failed');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('fn')
      .description('Edge function management')
      .argument('<action>', 'Action: new, deploy, logs')
      .argument('<name>', 'Function name')
      .action(async (action, name) => {
        assertValidProjectName(name);
        const spinner = ora(`Running fn ${action}...`).start();
        try {
          let args: string[];
          switch (action) {
            case 'new':
              args = ['functions', 'new', name];
              break;
            case 'deploy':
              args = ['functions', 'deploy', name];
              break;
            case 'logs':
              args = ['functions', 'logs', name];
              break;
            default:
              throw new CLIError(
                `Invalid action: "${action}"`,
                1,
                'Valid actions: new, deploy, logs',
              );
          }

          const output = await runSupabaseCommand(args);
          spinner.stop();
          console.log(output);
        } catch (error) {
          spinner.fail(`Function ${action} failed`);
          handleError(error);
        }
      }),
  );
