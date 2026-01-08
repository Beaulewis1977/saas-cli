import { Command } from 'commander';

export const genCommand = new Command('gen')
  .description('Generate boilerplate code for Flutter/Dart patterns')
  .addCommand(
    new Command('riverpod')
      .description('Generate Riverpod providers')
      .argument('<pattern>', 'Pattern: notifier, async-notifier, future, stream, family')
      .argument('<name>', 'Provider name')
      .option('-s, --state <type>', 'State type (e.g., "List<User>")')
      .option('-o, --output <path>', 'Output file path')
      .action(async (pattern, name, options) => {
        const { riverpodAction } = await import('./riverpod.js');
        await riverpodAction(pattern, name, options);
      }),
  )
  .addCommand(
    new Command('drift')
      .description('Generate Drift database code')
      .argument('<type>', 'Type: table, dao, migration')
      .argument('<name>', 'Table or DAO name')
      .option('-c, --columns <spec>', 'Column specification (for table)')
      .option('-o, --output <path>', 'Output file path')
      .action(async (type, name, options) => {
        const { driftAction } = await import('./drift.js');
        await driftAction(type, name, options);
      }),
  )
  .addCommand(
    new Command('gorouter')
      .description('Generate GoRouter routes')
      .argument('<name>', 'Route name')
      .option('-p, --path <path>', 'Route path (e.g., /recipe/:id)')
      .option('--params <params>', 'Path parameters (e.g., id:string)')
      .option('-o, --output <path>', 'Output file path')
      .action(async (name, options) => {
        const { gorouterAction } = await import('./gorouter.js');
        await gorouterAction(name, options);
      }),
  )
  .addCommand(
    new Command('powersync')
      .description('Generate PowerSync sync rules')
      .argument('<type>', 'Type: rules, schema')
      .argument('<table>', 'Table name')
      .option('-u, --user-column <column>', 'User ID column for sync rules')
      .option('-o, --output <path>', 'Output file path')
      .action(async (type, table, options) => {
        const { powersyncAction } = await import('./powersync.js');
        await powersyncAction(type, table, options);
      }),
  )
  .addCommand(
    new Command('freezed')
      .description('Generate Freezed models')
      .argument('<name>', 'Model name')
      .option(
        '-f, --fields <spec>',
        'Field specification (e.g., id:String,name:String,email:String?)',
      )
      .option('-o, --output <path>', 'Output file path')
      .action(async (name, options) => {
        const { freezedAction } = await import('./freezed.js');
        await freezedAction(name, options);
      }),
  )
  .addCommand(
    new Command('repository')
      .description('Generate repository pattern')
      .argument('<name>', 'Repository name')
      .option('-e, --entity <name>', 'Entity name')
      .option('-o, --output <path>', 'Output file path')
      .action(async (name, options) => {
        const { repositoryAction } = await import('./repository.js');
        await repositoryAction(name, options);
      }),
  );
