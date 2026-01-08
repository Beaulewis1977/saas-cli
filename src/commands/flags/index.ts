import { Command } from 'commander';
import got from 'got';
import ora from 'ora';
import pc from 'picocolors';
import { loadGlobalConfig } from '../../utils/config.js';
import { AuthError, handleError } from '../../utils/error.js';
import { formatTable } from '../../utils/output.js';

const POSTHOG_API = 'https://app.posthog.com/api';

async function getPostHogConfig() {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;

  if (!projectId || !apiKey) {
    const config = await loadGlobalConfig();
    return {
      projectId: projectId || config.posthog?.projectId,
      apiKey: apiKey || config.posthog?.apiKey,
    };
  }

  return { projectId, apiKey };
}

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  active: boolean;
  rollout_percentage?: number;
}

export const flagsCommand = new Command('flags')
  .description('PostHog feature flag management')
  .addCommand(
    new Command('list').description('List all feature flags').action(async () => {
      const spinner = ora('Fetching feature flags...').start();
      try {
        const { projectId, apiKey } = await getPostHogConfig();

        if (!projectId || !apiKey) {
          throw new AuthError(
            'PostHog credentials not found',
            'Set POSTHOG_PROJECT_ID and POSTHOG_API_KEY environment variables',
          );
        }

        const response = await got
          .get(`${POSTHOG_API}/projects/${projectId}/feature_flags`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          .json<{ results: FeatureFlag[] }>();

        spinner.stop();

        const rows = response.results.map((flag) => [
          flag.key,
          flag.active ? pc.green('enabled') : pc.red('disabled'),
          flag.rollout_percentage !== undefined ? `${flag.rollout_percentage}%` : '100%',
        ]);

        console.log(formatTable(['Flag', 'Status', 'Rollout'], rows));
      } catch (error) {
        spinner.fail('Failed to fetch feature flags');
        handleError(error);
      }
    }),
  )
  .addCommand(
    new Command('get')
      .description('Get feature flag details')
      .argument('<flag>', 'Flag key')
      .action(async (flag) => {
        const spinner = ora(`Fetching flag: ${flag}...`).start();
        try {
          const { projectId, apiKey } = await getPostHogConfig();

          if (!projectId || !apiKey) {
            throw new AuthError(
              'PostHog credentials not found',
              'Set POSTHOG_PROJECT_ID and POSTHOG_API_KEY environment variables',
            );
          }

          const response = await got
            .get(`${POSTHOG_API}/projects/${projectId}/feature_flags`, {
              headers: { Authorization: `Bearer ${apiKey}` },
              searchParams: { key: flag },
            })
            .json<{ results: FeatureFlag[] }>();

          spinner.stop();

          const flagData = response.results.find((f) => f.key === flag);
          if (!flagData) {
            console.log(pc.yellow(`Flag "${flag}" not found`));
            return;
          }

          console.log(pc.cyan(`Flag: ${flagData.key}`));
          console.log(`  Name: ${flagData.name || 'N/A'}`);
          console.log(`  Status: ${flagData.active ? pc.green('enabled') : pc.red('disabled')}`);
          console.log(`  Rollout: ${flagData.rollout_percentage ?? 100}%`);
        } catch (error) {
          spinner.fail('Failed to fetch flag');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('set')
      .description('Enable or disable a feature flag')
      .argument('<flag>', 'Flag key')
      .argument('<value>', 'true/false or percentage (0-100)')
      .action(async (flag, value) => {
        const spinner = ora(`Updating flag: ${flag}...`).start();
        try {
          const { projectId, apiKey } = await getPostHogConfig();

          if (!projectId || !apiKey) {
            throw new AuthError(
              'PostHog credentials not found',
              'Set POSTHOG_PROJECT_ID and POSTHOG_API_KEY environment variables',
            );
          }

          // First, find the flag ID
          const listResponse = await got
            .get(`${POSTHOG_API}/projects/${projectId}/feature_flags`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            .json<{ results: FeatureFlag[] }>();

          const flagData = listResponse.results.find((f) => f.key === flag);
          if (!flagData) {
            spinner.fail(`Flag "${flag}" not found`);
            return;
          }

          // Determine if it's a boolean or percentage
          const isPercentage = /^\d+$/.test(value) && Number.parseInt(value) <= 100;
          const isBoolean = value === 'true' || value === 'false';

          const updateData: Record<string, unknown> = {};
          if (isPercentage) {
            updateData.rollout_percentage = Number.parseInt(value);
          } else if (isBoolean) {
            updateData.active = value === 'true';
          } else {
            spinner.fail('Value must be true, false, or a percentage (0-100)');
            return;
          }

          await got.patch(`${POSTHOG_API}/projects/${projectId}/feature_flags/${flagData.id}`, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            json: updateData,
          });

          spinner.succeed('Feature flag updated');
          console.log(pc.green(`${flag} = ${value}`));
        } catch (error) {
          spinner.fail('Failed to update flag');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('add-user')
      .description('Add user to flag override')
      .argument('<flag>', 'Flag key')
      .argument('<userId>', 'User ID')
      .action(async (flag, userId) => {
        console.log(pc.yellow('Note: User-level overrides require PostHog Enterprise'));
        console.log(pc.dim(`Would add user ${userId} to flag ${flag}`));
      }),
  )
  .addCommand(
    new Command('remove-user')
      .description('Remove user from flag override')
      .argument('<flag>', 'Flag key')
      .argument('<userId>', 'User ID')
      .action(async (flag, userId) => {
        console.log(pc.yellow('Note: User-level overrides require PostHog Enterprise'));
        console.log(pc.dim(`Would remove user ${userId} from flag ${flag}`));
      }),
  );
