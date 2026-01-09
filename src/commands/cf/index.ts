import { Command } from 'commander';
import ora from 'ora';
import { AuthError, CLIError, handleError } from '../../utils/error.js';
import { execFileAsync } from '../../utils/exec.js';
import { assertValidWorkerName } from '../../utils/validation.js';

async function checkWranglerCLI(): Promise<boolean> {
  try {
    await execFileAsync('wrangler', ['--version']);
    return true;
  } catch {
    return false;
  }
}

async function runWranglerCommand(args: string[]): Promise<string> {
  const isInstalled = await checkWranglerCLI();
  if (!isInstalled) {
    throw new CLIError('Wrangler CLI not found', 1, 'Install with: pnpm add -g wrangler');
  }

  if (!process.env.CF_API_TOKEN && !process.env.CLOUDFLARE_API_TOKEN) {
    throw new AuthError(
      'Cloudflare API token not found',
      'Set CF_API_TOKEN or CLOUDFLARE_API_TOKEN environment variable',
    );
  }

  try {
    const { stdout, stderr } = await execFileAsync('wrangler', args);
    if (stderr && !stderr.includes('warning')) {
      console.error(stderr);
    }
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CLIError(`Wrangler command failed: ${message}`);
  }
}

export const cfCommand = new Command('cf')
  .description('Cloudflare Workers and KV management')
  .addCommand(
    new Command('worker')
      .description('Worker management')
      .argument('<action>', 'Action: new, deploy, logs, list')
      .argument('[name]', 'Worker name')
      .action(async (action, name) => {
        const spinner = ora(`Worker ${action}...`).start();
        try {
          let args: string[];
          switch (action) {
            case 'new':
              if (!name) throw new CLIError('Worker name required for "new" action');
              assertValidWorkerName(name);
              args = ['init', name];
              break;
            case 'deploy':
              if (name) assertValidWorkerName(name);
              args = name ? ['deploy', '--name', name] : ['deploy'];
              break;
            case 'logs':
              if (name) assertValidWorkerName(name);
              args = name ? ['tail', name] : ['tail'];
              break;
            case 'list':
              args = ['deployments', 'list'];
              break;
            default:
              throw new CLIError(
                `Invalid action: "${action}"`,
                1,
                'Valid actions: new, deploy, logs, list',
              );
          }

          const output = await runWranglerCommand(args);
          spinner.stop();
          console.log(output);
        } catch (error) {
          spinner.fail(`Worker ${action} failed`);
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('kv')
      .description('KV namespace operations')
      .argument('<action>', 'Action: namespaces, keys, get, put, del')
      .argument('[namespace]', 'KV namespace ID')
      .argument('[key]', 'Key name')
      .argument('[value]', 'Value (for put)')
      .action(async (action, namespace, key, value) => {
        const spinner = ora(`KV ${action}...`).start();
        try {
          let args: string[];
          switch (action) {
            case 'namespaces':
              args = ['kv:namespace', 'list'];
              break;
            case 'keys':
              if (!namespace) throw new CLIError('Namespace ID required');
              args = ['kv:key', 'list', '--namespace-id', namespace];
              break;
            case 'get':
              if (!namespace || !key) throw new CLIError('Namespace and key required');
              args = ['kv:key', 'get', key, '--namespace-id', namespace];
              break;
            case 'put':
              if (!namespace || !key || !value)
                throw new CLIError('Namespace, key, and value required');
              args = ['kv:key', 'put', key, value, '--namespace-id', namespace];
              break;
            case 'del':
              if (!namespace || !key) throw new CLIError('Namespace and key required');
              args = ['kv:key', 'delete', key, '--namespace-id', namespace];
              break;
            default:
              throw new CLIError(
                `Invalid action: "${action}"`,
                1,
                'Valid actions: namespaces, keys, get, put, del',
              );
          }

          const output = await runWranglerCommand(args);
          spinner.stop();
          console.log(output);
        } catch (error) {
          spinner.fail(`KV ${action} failed`);
          handleError(error);
        }
      }),
  );
