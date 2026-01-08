import ora from 'ora';
import { getContext7Client } from '../../services/context7.js';
import { getAPIKey, loadGlobalConfig } from '../../utils/config.js';
import { AuthError, handleError } from '../../utils/error.js';
import { formatBox } from '../../utils/output.js';

export async function dartAction(query: string): Promise<void> {
  const spinner = ora('Searching Dart documentation...').start();

  try {
    const config = await loadGlobalConfig();
    const apiKey = getAPIKey('context7', config);

    if (!apiKey) {
      spinner.fail('Context7 API key not found');
      throw new AuthError(
        'CONTEXT7_API_KEY environment variable is not set',
        'Get your API key from https://context7.com/dashboard and set CONTEXT7_API_KEY',
      );
    }

    const client = getContext7Client(apiKey);
    const result = await client.search('dart', query);

    spinner.stop();

    const output = formatBox(`DART: ${query}`, result);
    console.log(output);
  } catch (error) {
    spinner.fail('Failed to fetch documentation');
    handleError(error);
  }
}
