# Contributing to saas-cli

Thank you for your interest in contributing to saas-cli!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Beaulewis1977/saas-cli.git
cd saas-cli

# Install dependencies
pnpm install

# Run in development mode (watches for changes)
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build
pnpm build
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point and command registration
├── index.ts            # Main entry
├── commands/           # Command implementations
│   ├── ask/           # AI questions (Perplexity)
│   ├── cf/            # Cloudflare Workers/KV
│   ├── docs/          # Documentation lookup (Context7)
│   ├── flags/         # Feature flags (PostHog)
│   ├── gen/           # Code generation
│   ├── init/          # Project scaffolding
│   ├── push/          # Push notifications (OneSignal)
│   ├── redis/         # Redis cache management
│   ├── supabase/      # Supabase management
│   └── video/         # Video processing (FFmpeg)
├── services/           # External service integrations
│   ├── context7.ts    # Context7 API
│   ├── http.ts        # HTTP client wrapper
│   ├── perplexity.ts  # Perplexity API
│   ├── supabase.ts    # Supabase SDK
│   └── template.ts    # Template rendering
├── utils/              # Utilities
│   ├── cache.ts       # File-based caching
│   ├── config.ts      # Configuration management
│   ├── error.ts       # Error handling
│   └── output.ts      # Formatted output
└── types/              # TypeScript types

templates/              # Handlebars templates for code generation
tests/                  # Test files
```

## Code Standards

- **TypeScript** with strict mode enabled
- **ESM modules** (Node.js 20+)
- **Commander.js** for CLI structure
- **Handlebars** for code templates
- **Biome** for linting and formatting

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new riverpod generator template
fix: correct RLS policy generation for public tables
docs: update README with new examples
test: add integration tests for supabase commands
chore: update dependencies
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit with conventional commit message
7. Push to your fork
8. Open a pull request

## Adding a New Command

1. Create a new directory under `src/commands/`
2. Implement the command in `index.ts`:

```typescript
import { Command } from 'commander';
import { output } from '../../utils/output.js';
import { CLIError } from '../../utils/error.js';

export const myCommand = new Command('mycommand')
  .description('Description of what this command does')
  .argument('<required>', 'Required argument')
  .option('-o, --optional <value>', 'Optional flag')
  .action(async (required, options) => {
    try {
      // Implementation
      output.success('Done!');
    } catch (error) {
      throw new CLIError('Something went wrong', error);
    }
  });
```

3. Register the command in `src/cli.ts`
4. Add tests in `tests/`
5. Update README.md with documentation

## Adding Templates

Templates live in `templates/` and use Handlebars syntax:

- Use `{{{ }}}` for code that shouldn't be HTML-escaped
- Use `{{ }}` for regular interpolation
- Partials can be registered in the template service

## Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run with coverage
pnpm test:coverage
```

## Questions?

Open an issue or reach out to blewisxx@gmail.com
