import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { getPerplexityClient } from '../../services/perplexity.js';
import { MODEL_ALIASES, type PerplexityModel } from '../../types/index.js';
import { getAPIKey, loadGlobalConfig } from '../../utils/config.js';
import { AuthError, handleError } from '../../utils/error.js';

interface AskOptions {
  model?: string;
  recent?: 'day' | 'week' | 'month' | 'year';
  domains?: string;
  sources?: boolean;
  json?: boolean;
}

export const askCommand = new Command('ask')
  .description('Ask AI-powered questions with web search (Perplexity)')
  .argument('<query>', 'Your question')
  .option('-m, --model <model>', 'Model: sonar, pro, reasoning, deep', 'sonar')
  .option('--recent <period>', 'Filter by recency: day, week, month, year')
  .option('--domains <domains>', 'Limit to domains (comma-separated)')
  .option('--sources', 'Include source URLs in output')
  .option('--json', 'Output as JSON')
  .action(async (query: string, options: AskOptions) => {
    const modelAlias = options.model ?? 'sonar';
    const model: PerplexityModel = MODEL_ALIASES[modelAlias] ?? 'sonar';
    const modelDisplay = modelAlias.toUpperCase();

    const spinner = ora(`Asking ${modelDisplay}...`).start();

    try {
      const config = await loadGlobalConfig();
      const apiKey = getAPIKey('perplexity', config);

      if (!apiKey) {
        spinner.fail('Perplexity API key not found');
        throw new AuthError(
          'PERPLEXITY_API_KEY environment variable is not set',
          'Get your API key from https://perplexity.ai/settings/api and set PERPLEXITY_API_KEY',
        );
      }

      const client = getPerplexityClient(apiKey);
      const result = await client.ask(query, {
        model,
        searchRecencyFilter: options.recent,
        searchDomainFilter: options.domains?.split(','),
        returnSources: options.sources,
      });

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify({ query, model: modelAlias, result }, null, 2));
      } else {
        console.log(pc.cyan(`\n━━━ ${modelDisplay} ━━━\n`));
        console.log(result);
      }
    } catch (error) {
      spinner.fail('Query failed');
      handleError(error);
    }
  });
