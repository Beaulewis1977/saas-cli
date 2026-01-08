import pc from 'picocolors';
import { renderTemplate } from '../../services/template.js';
import { handleError } from '../../utils/error.js';

interface GoRouterOptions {
  path?: string;
  params?: string;
  output?: string;
}

export async function gorouterAction(name: string, options: GoRouterOptions): Promise<void> {
  try {
    // Parse path parameters
    const pathParams: Array<{ name: string; type: string }> = [];

    if (options.params) {
      const paramParts = options.params.split(',');
      for (const param of paramParts) {
        const [paramName, paramType] = param.split(':');
        if (paramName) {
          pathParams.push({
            name: paramName.trim(),
            type: paramType?.trim() || 'String',
          });
        }
      }
    }

    // Extract params from path if not specified
    const routePath =
      options.path ||
      `/${name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')}`;
    const pathMatches = routePath.match(/:(\w+)/g);

    if (pathMatches && pathParams.length === 0) {
      for (const match of pathMatches) {
        const paramName = match.slice(1);
        pathParams.push({ name: paramName, type: 'String' });
      }
    }

    // Prepare context
    const context = {
      name,
      routeName: name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, ''),
      path: routePath,
      params: pathParams,
      hasParams: pathParams.length > 0,
      screenName: name.charAt(0).toUpperCase() + name.slice(1) + 'Screen',
    };

    // Render template
    const output = await renderTemplate('gorouter', 'route', context);

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
