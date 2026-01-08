import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { handleError } from '../../utils/error.js';

interface RepositoryOptions {
  entity?: string;
  output?: string;
}

export async function repositoryAction(name: string, options: RepositoryOptions): Promise<void> {
  try {
    // Derive entity name from repository name if not provided
    const entityName = options.entity || name.replace(/Repository$/i, '');

    // Prepare context
    const context = {
      name,
      repositoryName: name.endsWith('Repository') ? name : name + 'Repository',
      entityName,
      entityNameLower: entityName.charAt(0).toLowerCase() + entityName.slice(1),
    };

    // Render template
    const output = await renderTemplate('repository', 'repository', context);

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
