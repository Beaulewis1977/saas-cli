import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { CLIError, handleError } from '../../utils/error.js';
import { validateOutputPath } from '../../utils/path.js';

interface PowerSyncOptions {
  userColumn?: string;
  output?: string;
}

const VALID_TYPES = ['rules', 'schema'];

export async function powersyncAction(
  type: string,
  table: string,
  options: PowerSyncOptions,
): Promise<void> {
  try {
    // Validate type
    if (!VALID_TYPES.includes(type)) {
      throw new CLIError(`Invalid type: "${type}"`, 1, `Valid types: ${VALID_TYPES.join(', ')}`);
    }

    // Prepare context
    const context = {
      table,
      tableName: table,
      userColumn: options.userColumn || 'user_id',
    };

    // Render template
    const output = await renderTemplate('powersync', type, context);

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
