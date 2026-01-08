import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { columnsToDrift, parseColumnSpec } from '../../utils/column-parser.js';
import { CLIError, handleError } from '../../utils/error.js';

interface DriftOptions {
  columns?: string;
  output?: string;
}

const VALID_TYPES = ['table', 'dao', 'migration'];

export async function driftAction(
  type: string,
  name: string,
  options: DriftOptions,
): Promise<void> {
  try {
    // Validate type
    if (!VALID_TYPES.includes(type)) {
      throw new CLIError(`Invalid type: "${type}"`, 1, `Valid types: ${VALID_TYPES.join(', ')}`);
    }

    let output: string;

    if (type === 'table') {
      if (!options.columns) {
        throw new CLIError(
          'Columns specification required for table generation',
          1,
          'Use --columns "id:int:pk,title:text,userId:uuid:fk(auth.users)"',
        );
      }

      const columns = parseColumnSpec(options.columns);
      output = columnsToDrift(name, columns);
    } else if (type === 'dao') {
      const context = {
        name,
        tableName: name,
      };
      output = await renderTemplate('drift', 'dao', context);
    } else {
      // migration
      const context = {
        name,
        date: new Date().toISOString().split('T')[0]?.replace(/-/g, ''),
      };
      output = await renderTemplate('drift', 'migration', context);
    }

    // Output result
    if (options.output) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(options.output, output);
      console.log(pc.green(`✓ Generated ${options.output}`));
    } else {
      console.log(output);
    }
  } catch (error) {
    handleError(error);
  }
}
