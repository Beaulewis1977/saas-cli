import { Command } from 'commander';
import got from 'got';
import ora from 'ora';
import pc from 'picocolors';
import { loadGlobalConfig } from '../../utils/config.js';
import { AuthError, handleError } from '../../utils/error.js';

const ONESIGNAL_API = 'https://onesignal.com/api/v1';

async function getOneSignalConfig() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    const config = await loadGlobalConfig();
    return {
      appId: appId || config.onesignal?.appId,
      apiKey: apiKey || config.onesignal?.apiKey,
    };
  }

  return { appId, apiKey };
}

async function sendNotification(
  target: { userId?: string; segment?: string },
  message: string,
  data?: Record<string, unknown>,
  scheduleAt?: string,
) {
  const { appId, apiKey } = await getOneSignalConfig();

  if (!appId || !apiKey) {
    throw new AuthError(
      'OneSignal credentials not found',
      'Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY environment variables',
    );
  }

  const payload: Record<string, unknown> = {
    app_id: appId,
    contents: { en: message },
  };

  if (target.userId) {
    payload.include_external_user_ids = [target.userId];
  } else if (target.segment) {
    payload.included_segments = [target.segment];
  }

  if (data) {
    payload.data = data;
  }

  if (scheduleAt) {
    payload.send_after = scheduleAt;
  }

  const response = await got
    .post(`${ONESIGNAL_API}/notifications`, {
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      json: payload,
    })
    .json<{ id: string; recipients: number }>();

  return response;
}

export const pushCommand = new Command('push')
  .description('OneSignal push notification management')
  .addCommand(
    new Command('send')
      .description('Send a push notification')
      .argument('<target>', 'User ID or segment name')
      .argument('<message>', 'Notification message')
      .option('-s, --segment', 'Target is a segment name')
      .option('-d, --data <json>', 'Additional data (JSON)')
      .action(async (target, message, options) => {
        const spinner = ora('Sending notification...').start();
        try {
          const data = options.data ? JSON.parse(options.data) : undefined;
          const targetObj = options.segment ? { segment: target } : { userId: target };

          const result = await sendNotification(targetObj, message, data);

          spinner.succeed('Notification sent');
          console.log(pc.green(`ID: ${result.id}`));
          console.log(pc.dim(`Recipients: ${result.recipients}`));
        } catch (error) {
          spinner.fail('Failed to send notification');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('schedule')
      .description('Schedule a push notification')
      .argument('<target>', 'User ID')
      .argument('<message>', 'Notification message')
      .option(
        '--at <datetime>',
        'Send time (ISO 8601 format)',
        new Date(Date.now() + 3600000).toISOString(),
      )
      .option('-d, --data <json>', 'Additional data (JSON)')
      .action(async (target, message, options) => {
        const spinner = ora('Scheduling notification...').start();
        try {
          const data = options.data ? JSON.parse(options.data) : undefined;

          const result = await sendNotification({ userId: target }, message, data, options.at);

          spinner.succeed('Notification scheduled');
          console.log(pc.green(`ID: ${result.id}`));
          console.log(pc.dim(`Scheduled for: ${options.at}`));
        } catch (error) {
          spinner.fail('Failed to schedule notification');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('template')
      .description('Template operations')
      .argument('<action>', 'Action: list, send')
      .argument('[templateId]', 'Template ID (for send)')
      .option('--to <userId>', 'Target user ID (for send)')
      .action(async (action, templateId, options) => {
        const spinner = ora(`Template ${action}...`).start();
        try {
          const { appId, apiKey } = await getOneSignalConfig();

          if (!appId || !apiKey) {
            throw new AuthError(
              'OneSignal credentials not found',
              'Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY environment variables',
            );
          }

          if (action === 'list') {
            const response = await got
              .get(`${ONESIGNAL_API}/templates?app_id=${appId}`, {
                headers: { Authorization: `Basic ${apiKey}` },
              })
              .json<{ templates: Array<{ id: string; name: string }> }>();

            spinner.stop();
            console.log(pc.cyan('Templates:'));
            for (const template of response.templates) {
              console.log(`  ${pc.green(template.id)} - ${template.name}`);
            }
          } else if (action === 'send') {
            if (!templateId || !options.to) {
              throw new Error('Template ID and target user required');
            }

            const response = await got
              .post(`${ONESIGNAL_API}/notifications`, {
                headers: {
                  Authorization: `Basic ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                json: {
                  app_id: appId,
                  template_id: templateId,
                  include_external_user_ids: [options.to],
                },
              })
              .json<{ id: string }>();

            spinner.succeed('Template notification sent');
            console.log(pc.green(`ID: ${response.id}`));
          }
        } catch (error) {
          spinner.fail(`Template ${action} failed`);
          handleError(error);
        }
      }),
  );
