import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { CLIError, handleError } from '../../utils/error.js';
import { validateOutputPath } from '../../utils/path.js';

interface FreezedOptions {
  fields?: string;
  output?: string;
}

interface FieldSpec {
  name: string;
  type: string;
  isNullable: boolean;
  hasDefault: boolean;
  defaultValue?: string;
}

export async function freezedAction(name: string, options: FreezedOptions): Promise<void> {
  try {
    // Parse fields
    const fields: FieldSpec[] = [];

    if (options.fields) {
      const fieldParts = options.fields.split(',');
      for (const field of fieldParts) {
        const [fieldName, fieldType] = field.trim().split(':');
        if (fieldName && fieldType) {
          const isNullable = fieldType.endsWith('?');
          const cleanType = isNullable ? fieldType.slice(0, -1) : fieldType;

          fields.push({
            name: fieldName.trim(),
            type: cleanType,
            isNullable,
            hasDefault: false,
          });
        }
      }
    }

    if (fields.length === 0) {
      throw new CLIError(
        'Fields specification required for Freezed generation',
        1,
        'Use --fields "id:String,name:String,email:String?"',
      );
    }

    // Prepare context
    const context = {
      name,
      className: name.charAt(0).toUpperCase() + name.slice(1),
      fileName: name
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, ''),
      fields,
    };

    // Render template
    const output = await renderTemplate('freezed', 'model', context);

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
