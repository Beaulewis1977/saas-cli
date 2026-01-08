import { Command } from 'commander';

export const docsCommand = new Command('docs')
  .description('Look up documentation via Context7')
  .addCommand(
    new Command('flutter')
      .description('Search Flutter documentation')
      .argument('<query>', 'Search query')
      .action(async (query) => {
        const { flutterAction } = await import('./flutter.js');
        await flutterAction(query);
      }),
  )
  .addCommand(
    new Command('dart')
      .description('Search Dart documentation')
      .argument('<query>', 'Search query')
      .action(async (query) => {
        const { dartAction } = await import('./dart.js');
        await dartAction(query);
      }),
  )
  .addCommand(
    new Command('package')
      .description('Search package documentation')
      .argument('<package>', 'Package name')
      .argument('[query]', 'Search query')
      .action(async (pkg, query) => {
        const { packageAction } = await import('./package.js');
        await packageAction(pkg, query);
      }),
  )
  .addCommand(
    new Command('widget')
      .description('Look up widget documentation')
      .argument('<name>', 'Widget name')
      .option('--properties', 'Show all properties')
      .action(async (name, options) => {
        const { widgetAction } = await import('./widget.js');
        await widgetAction(name, options);
      }),
  );
