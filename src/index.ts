import dotenv from 'dotenv';
import { run } from './cli.js';

// Load .env from current working directory
// Shell exports take precedence (override: false is default)
// quiet: true suppresses dotenv's default logging
const result = dotenv.config({ quiet: true });
if (result.error && process.env.DEBUG) {
  console.error('[dotenv]', result.error.message);
}

run();
