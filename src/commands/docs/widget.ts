import ora from 'ora';
import { getContext7Client } from '../../services/context7.js';
import { getAPIKey, loadGlobalConfig } from '../../utils/config.js';
import { AuthError, handleError } from '../../utils/error.js';
import { formatBox } from '../../utils/output.js';

interface WidgetOptions {
  properties?: boolean;
}

export async function widgetAction(name: string, options: WidgetOptions): Promise<void> {
  const query = options.properties
    ? `${name} widget all properties and parameters`
    : `${name} widget usage and examples`;

  const spinner = ora(`Looking up ${name} widget...`).start();

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
    const result = await client.search('flutter', query);

    spinner.stop();

    const output = formatBox(`Widget: ${name}`, result);
    console.log(output);
  } catch (error) {
    spinner.fail('Failed to fetch widget documentation');
    handleError(error);
  }
}
