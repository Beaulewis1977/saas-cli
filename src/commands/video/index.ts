import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { CLIError, handleError } from '../../utils/error.js';

const execAsync = promisify(exec);

async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

async function runFFmpeg(args: string[]): Promise<string> {
  const isInstalled = await checkFFmpeg();
  if (!isInstalled) {
    throw new CLIError(
      'FFmpeg not found',
      1,
      'Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)',
    );
  }

  try {
    const { stdout, stderr } = await execAsync(`ffmpeg ${args.join(' ')}`);
    return stdout || stderr;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CLIError(`FFmpeg command failed: ${message}`);
  }
}

async function runFFprobe(args: string[]): Promise<string> {
  const isInstalled = await checkFFmpeg();
  if (!isInstalled) {
    throw new CLIError(
      'FFmpeg/FFprobe not found',
      1,
      'Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)',
    );
  }

  try {
    const { stdout } = await execAsync(`ffprobe ${args.join(' ')}`);
    return stdout;
  } catch (error) {
    const err = error as { stderr?: string };
    return err.stderr || '';
  }
}

export const videoCommand = new Command('video')
  .description('Video processing with FFmpeg')
  .addCommand(
    new Command('info')
      .description('Get video file information')
      .argument('<file>', 'Video file path')
      .action(async (file) => {
        const spinner = ora('Analyzing video...').start();
        try {
          const output = await runFFprobe([
            '-v',
            'quiet',
            '-print_format',
            'json',
            '-show_format',
            '-show_streams',
            `"${file}"`,
          ]);

          spinner.stop();

          try {
            const info = JSON.parse(output);
            const format = info.format || {};
            const videoStream =
              info.streams?.find((s: { codec_type: string }) => s.codec_type === 'video') || {};
            const audioStream =
              info.streams?.find((s: { codec_type: string }) => s.codec_type === 'audio') || {};

            console.log(pc.cyan('Video Information:'));
            console.log(`  File: ${format.filename || file}`);
            console.log(
              `  Duration: ${format.duration ? Number.parseFloat(format.duration).toFixed(2) + 's' : 'N/A'}`,
            );
            console.log(
              `  Size: ${format.size ? (Number.parseInt(format.size, 10) / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`,
            );
            console.log(
              `  Bitrate: ${format.bit_rate ? (Number.parseInt(format.bit_rate, 10) / 1000).toFixed(0) + ' kbps' : 'N/A'}`,
            );

            if (videoStream.width) {
              console.log(pc.cyan('\nVideo Stream:'));
              console.log(`  Resolution: ${videoStream.width}x${videoStream.height}`);
              console.log(`  Codec: ${videoStream.codec_name || 'N/A'}`);
              console.log(`  FPS: ${videoStream.r_frame_rate || 'N/A'}`);
            }

            if (audioStream.codec_name) {
              console.log(pc.cyan('\nAudio Stream:'));
              console.log(`  Codec: ${audioStream.codec_name}`);
              console.log(`  Sample Rate: ${audioStream.sample_rate || 'N/A'} Hz`);
              console.log(`  Channels: ${audioStream.channels || 'N/A'}`);
            }
          } catch {
            console.log(output);
          }
        } catch (error) {
          spinner.fail('Failed to analyze video');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('combine')
      .description('Combine video and audio')
      .argument('<video>', 'Video file path')
      .argument('<audio>', 'Audio file path')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, audio, options) => {
        const spinner = ora('Combining video and audio...').start();
        try {
          await runFFmpeg([
            '-i',
            `"${video}"`,
            '-i',
            `"${audio}"`,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-y',
            `"${options.output}"`,
          ]);

          spinner.succeed(`Combined: ${options.output}`);
        } catch (error) {
          spinner.fail('Failed to combine video and audio');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('thumbnail')
      .description('Extract thumbnail from video')
      .argument('<video>', 'Video file path')
      .option('--at <timestamp>', 'Timestamp (e.g., 00:00:05)', '00:00:01')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        const spinner = ora('Extracting thumbnail...').start();
        try {
          await runFFmpeg([
            '-i',
            `"${video}"`,
            '-ss',
            options.at,
            '-vframes',
            '1',
            '-y',
            `"${options.output}"`,
          ]);

          spinner.succeed(`Thumbnail: ${options.output}`);
        } catch (error) {
          spinner.fail('Failed to extract thumbnail');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('resize')
      .description('Resize video')
      .argument('<video>', 'Video file path')
      .requiredOption('-s, --size <WxH>', 'New size (e.g., 1280x720)')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        const spinner = ora('Resizing video...').start();
        try {
          await runFFmpeg([
            '-i',
            `"${video}"`,
            '-vf',
            `scale=${options.size}`,
            '-y',
            `"${options.output}"`,
          ]);

          spinner.succeed(`Resized: ${options.output}`);
        } catch (error) {
          spinner.fail('Failed to resize video');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('compress')
      .description('Compress video')
      .argument('<video>', 'Video file path')
      .option('-q, --quality <crf>', 'Quality (1-51, lower is better)', '23')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        const spinner = ora('Compressing video...').start();
        try {
          await runFFmpeg([
            '-i',
            `"${video}"`,
            '-c:v',
            'libx264',
            '-crf',
            options.quality,
            '-preset',
            'medium',
            '-y',
            `"${options.output}"`,
          ]);

          spinner.succeed(`Compressed: ${options.output}`);
        } catch (error) {
          spinner.fail('Failed to compress video');
          handleError(error);
        }
      }),
  )
  .addCommand(
    new Command('trim')
      .description('Trim video')
      .argument('<video>', 'Video file path')
      .requiredOption('--start <time>', 'Start time (e.g., 00:00:10)')
      .requiredOption('--end <time>', 'End time (e.g., 00:01:00)')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        const spinner = ora('Trimming video...').start();
        try {
          await runFFmpeg([
            '-i',
            `"${video}"`,
            '-ss',
            options.start,
            '-to',
            options.end,
            '-c',
            'copy',
            '-y',
            `"${options.output}"`,
          ]);

          spinner.succeed(`Trimmed: ${options.output}`);
        } catch (error) {
          spinner.fail('Failed to trim video');
          handleError(error);
        }
      }),
  );
