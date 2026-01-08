# SaaS CLI - Claude Code Instructions

## Project Overview

A unified CLI for Flutter SaaS development with:
- Documentation lookup (Context7)
- AI questions (Perplexity)
- Code generation (Riverpod, Drift, GoRouter, Freezed, etc.)
- Backend management (Supabase, Redis, Cloudflare, OneSignal, PostHog)
- Video processing (FFmpeg)

## Code Standards

- TypeScript with strict mode
- ESM modules (Node.js 20+)
- Commander.js for CLI structure
- Handlebars for code templates
- Vitest for testing
- Biome for linting and formatting

## When Reviewing PRs

1. Check for proper error handling with CLIError
2. Verify new commands have --help documentation
3. Ensure API keys are read from environment, never hardcoded
4. Check that new features have tests
5. Verify Handlebars templates use `{{{ }}}` for code that shouldn't be escaped

## When Fixing Issues

1. Run `pnpm test` before and after changes
2. Follow existing patterns in similar commands
3. Update relevant tests
4. Don't modify package.json dependencies without discussion

## Known Security Notes

Command injection vulnerabilities exist in `exec()` calls (video, init, cf, supabase commands).
These are documented for future improvement but are acceptable for v1.0 as they require local CLI access.
