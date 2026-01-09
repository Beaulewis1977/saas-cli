import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { CLIError, handleError } from '../../utils/error.js';
import { execFileAsync } from '../../utils/exec.js';
import { validateOutputPath } from '../../utils/path.js';
import {
  assertValidCRF,
  assertValidResolution,
  assertValidTimestamp,
} from '../../utils/validation.js';

async function checkFFmpeg(): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', ['-version']);
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
    const { stdout, stderr } = await execFileAsync('ffmpeg', args);
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
    const { stdout } = await execFileAsync('ffprobe', args);
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CLIError(`FFprobe command failed: ${message}`);
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
            file,
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
        const safePath = validateOutputPath(options.output);
        const spinner = ora('Combining video and audio...').start();
        try {
          await runFFmpeg([
            '-i',
            video,
            '-i',
            audio,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-y',
            safePath,
          ]);

          spinner.succeed(`Combined: ${safePath}`);
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
        assertValidTimestamp(options.at);
        const safePath = validateOutputPath(options.output);
        const spinner = ora('Extracting thumbnail...').start();
        try {
          await runFFmpeg(['-i', video, '-ss', options.at, '-vframes', '1', '-y', safePath]);

          spinner.succeed(`Thumbnail: ${safePath}`);
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
      .requiredOption('-s, --size <WxH>', 'New size (e.g., 1280x720 or -1:720)')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        assertValidResolution(options.size);
        const safePath = validateOutputPath(options.output);
        // Convert WxH format to W:H for FFmpeg scale filter
        const scaleSize = options.size.replace('x', ':');
        const spinner = ora('Resizing video...').start();
        try {
          await runFFmpeg(['-i', video, '-vf', `scale=${scaleSize}`, '-y', safePath]);

          spinner.succeed(`Resized: ${safePath}`);
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
      .option('-q, --quality <crf>', 'Quality (0-51, lower is better)', '23')
      .requiredOption('-o, --output <file>', 'Output file path')
      .action(async (video, options) => {
        assertValidCRF(options.quality);
        const safePath = validateOutputPath(options.output);
        const spinner = ora('Compressing video...').start();
        try {
          await runFFmpeg([
            '-i',
            video,
            '-c:v',
            'libx264',
            '-crf',
            options.quality,
            '-preset',
            'medium',
            '-y',
            safePath,
          ]);

          spinner.succeed(`Compressed: ${safePath}`);
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
        assertValidTimestamp(options.start);
        assertValidTimestamp(options.end);
        const safePath = validateOutputPath(options.output);
        const spinner = ora('Trimming video...').start();
        try {
          await runFFmpeg([
            '-i',
            video,
            '-ss',
            options.start,
            '-to',
            options.end,
            '-c',
            'copy',
            '-y',
            safePath,
          ]);

          spinner.succeed(`Trimmed: ${safePath}`);
        } catch (error) {
          spinner.fail('Failed to trim video');
          handleError(error);
        }
      }),
  );
