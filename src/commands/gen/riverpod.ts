import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { CLIError, handleError } from '../../utils/error.js';
import { validateOutputPath } from '../../utils/path.js';

interface RiverpodOptions {
  state?: string;
  output?: string;
}

const VALID_PATTERNS = ['notifier', 'async-notifier', 'future', 'stream', 'family'];

export async function riverpodAction(
  pattern: string,
  name: string,
  options: RiverpodOptions,
): Promise<void> {
  try {
    // Validate pattern
    if (!VALID_PATTERNS.includes(pattern)) {
      throw new CLIError(
        `Invalid pattern: "${pattern}"`,
        1,
        `Valid patterns: ${VALID_PATTERNS.join(', ')}`,
      );
    }

    // Map pattern to template name
    const templateName = pattern === 'async-notifier' ? 'async-notifier' : pattern;

    // Prepare context
    const context = {
      name,
      state: options.state || 'dynamic',
      hasState: !!options.state,
    };

    // Render template
    const output = await renderTemplate('riverpod', templateName, context);

    // Output result
    if (options.output) {
      const safePath = validateOutputPath(options.output);
      const { writeFile } = await import('node:fs/promises');
      await writeFile(safePath, output);
      console.log(pc.green(`✓ Generated ${safePath}`));
    } else {
      console.log(output);
    }
  } catch (error) {
    handleError(error);
  }
}
