import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { CLIError, handleError } from '../../utils/error.js';

export const initCommand = new Command('init')
  .description('Initialize projects and add features')
  .addCommand(
    new Command('flutter')
      .description('Initialize a new Flutter project with SaaS stack')
      .argument('<name>', 'Project name')
      .action(async (name) => {
        const spinner = ora('Creating Flutter project...').start();
        try {
          const { exec } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execAsync = promisify(exec);

          // Create Flutter project
          await execAsync(`flutter create ${name}`);
          spinner.text = 'Adding dependencies...';

          // Add dependencies
          const deps = [
            'flutter_riverpod',
            'riverpod_annotation',
            'go_router',
            'freezed_annotation',
            'json_annotation',
            'supabase_flutter',
          ];

          const devDeps = ['riverpod_generator', 'build_runner', 'freezed', 'json_serializable'];

          process.chdir(name);
          await execAsync(`flutter pub add ${deps.join(' ')}`);
          await execAsync(`flutter pub add --dev ${devDeps.join(' ')}`);

          spinner.succeed('Flutter project created');
          console.log(pc.green(`\nProject "${name}" created with:`));
          console.log('  - Riverpod (state management)');
          console.log('  - GoRouter (navigation)');
          console.log('  - Freezed (immutable models)');
          console.log('  - Supabase (backend)');
          console.log(`\nNext steps:`);
          console.log(`  cd ${name}`);
          console.log(`  flutter run`);
        } catch (error) {
          spinner.fail('Failed to create Flutter project');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('supabase')
      .description('Initialize Supabase in current project')
      .action(async () => {
        const spinner = ora('Initializing Supabase...').start();
        try {
          const { exec } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execAsync = promisify(exec);

          await execAsync('supabase init');

          spinner.succeed('Supabase initialized');
          console.log(pc.green('\nSupabase project created'));
          console.log('Next steps:');
          console.log('  supabase start');
          console.log('  supabase db push');
        } catch (error) {
          spinner.fail('Failed to initialize Supabase');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('worker')
      .description('Initialize a new Cloudflare Worker')
      .argument('<name>', 'Worker name')
      .action(async (name) => {
        const spinner = ora('Creating Cloudflare Worker...').start();
        try {
          const { exec } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execAsync = promisify(exec);

          await execAsync(`wrangler init ${name}`);

          spinner.succeed('Cloudflare Worker created');
          console.log(pc.green(`\nWorker "${name}" created`));
          console.log('Next steps:');
          console.log(`  cd ${name}`);
          console.log('  wrangler dev');
        } catch (error) {
          spinner.fail('Failed to create Worker');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('add')
      .description('Add a feature to existing Flutter project')
      .argument('<feature>', 'Feature: riverpod, drift, powersync, auth')
      .action(async (feature) => {
        const spinner = ora(`Adding ${feature}...`).start();
        try {
          const { exec } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execAsync = promisify(exec);

          let deps: string[] = [];
          let devDeps: string[] = [];

          switch (feature) {
            case 'riverpod':
              deps = ['flutter_riverpod', 'riverpod_annotation'];
              devDeps = ['riverpod_generator', 'build_runner'];
              break;
            case 'drift':
              deps = ['drift', 'sqlite3_flutter_libs', 'path_provider', 'path'];
              devDeps = ['drift_dev', 'build_runner'];
              break;
            case 'powersync':
              deps = ['powersync'];
              break;
            case 'auth':
              deps = ['supabase_flutter'];
              break;
            default:
              throw new CLIError(
                `Unknown feature: "${feature}"`,
                1,
                'Valid features: riverpod, drift, powersync, auth',
              );
          }

          if (deps.length > 0) {
            await execAsync(`flutter pub add ${deps.join(' ')}`);
          }
          if (devDeps.length > 0) {
            await execAsync(`flutter pub add --dev ${devDeps.join(' ')}`);
          }

          spinner.succeed(`${feature} added`);
          console.log(pc.green(`\n${feature} dependencies installed`));

          if (feature === 'riverpod' || feature === 'drift') {
            console.log('Run code generation:');
            console.log('  dart run build_runner build');
          }
        } catch (error) {
          spinner.fail(`Failed to add ${feature}`);
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('config').description('Create saas.yaml config file').action(async () => {
      const configPath = 'saas.yaml';

      if (existsSync(configPath)) {
        console.log(pc.yellow('saas.yaml already exists'));
        return;
      }

      const config = `# SaaS CLI Configuration
project:
  name: my-saas-app
  type: flutter

flutter:
  path: .

supabase:
  path: supabase
  types_output: lib/generated/supabase_types.dart

templates:
  riverpod:
    path: lib/features/{feature}/presentation/providers
  drift:
    path: lib/features/{feature}/data/datasources/local
  freezed:
    path: lib/features/{feature}/domain/entities
`;

      await writeFile(configPath, config);
      console.log(pc.green('✓ Created saas.yaml'));
    }),
  );
