# saas

A unified CLI for Flutter SaaS development with live documentation, AI-powered assistance, code generation, and backend integration.

## Features

- **Live Documentation** - Query Flutter, Dart, and package docs via Context7
- **AI-Powered Questions** - Ask technical questions with Perplexity AI
- **Code Generation** - Generate Riverpod, Drift, GoRouter, Freezed, and more
- **Supabase Management** - RLS policies, migrations, types, functions
- **Backend Services** - Redis, Cloudflare Workers, OneSignal, PostHog
- **Video Processing** - FFmpeg-based video operations

## Installation

```bash
# Global install via npm
npm install -g @beaulewis/saas-cli

# Global install via pnpm
pnpm add -g @beaulewis/saas-cli

# Run without installing (npx)
npx @beaulewis/saas-cli --help

# Or clone and link locally
git clone https://github.com/Beaulewis1977/saas-cli.git
cd saas-cli
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

```bash
# Check version
saas --version

# Get help
saas --help

# Look up Flutter documentation
saas docs flutter "ListView.builder with pagination"

# Ask AI a question
saas ask "best practices for offline-first Flutter apps"

# Generate a Riverpod notifier
saas gen riverpod notifier UserList --state "List<User>"
```

## Commands

### `docs` - Documentation Lookup

Query live documentation via Context7.

```bash
saas docs flutter "widget lifecycle"
saas docs dart "async streams"
saas docs package riverpod "provider family"
saas docs widget "TextField decoration"
```

### `ask` - AI-Powered Questions

Ask technical questions using Perplexity AI.

```bash
saas ask "how to implement pull-to-refresh in Flutter"
saas ask --model sonar-pro "explain Flutter rendering pipeline"
saas ask --model sonar-reasoning "debug this riverpod error"
saas ask --model sonar-deep-research "compare state management solutions"
```

**Models:**
- `sonar` (default) - Fast, general queries
- `sonar-pro` - Enhanced responses
- `sonar-reasoning` - Complex problem solving
- `sonar-deep-research` - In-depth research

### `gen` - Code Generation

Generate Flutter code scaffolds.

```bash
# Riverpod
saas gen riverpod notifier UserList --state "List<User>"
saas gen riverpod provider AuthService --async
saas gen riverpod family UserProfile --param userId

# Drift (SQLite)
saas gen drift table users --columns "id:int,name:text,email:text"
saas gen drift dao Users --table users

# GoRouter
saas gen gorouter route /profile --name profile
saas gen gorouter shell MainShell --routes home,profile,settings

# Freezed
saas gen freezed model User --fields "id:int,name:String,email:String?"
saas gen freezed union AuthState --variants loading,authenticated,unauthenticated

# PowerSync
saas gen powersync schema --from supabase
saas gen powersync sync-rules users,profiles

# Repository Pattern
saas gen repository User --methods "getById,getAll,create,update,delete"
```

### `supabase` - Database Management

Manage Supabase backend.

```bash
# View schema
saas supabase schema
saas supabase schema --table users

# Create table
saas supabase create-table profiles --columns "user_id:uuid,avatar:text,bio:text"

# RLS policies
saas supabase rls recipes --policy user-owned --column user_id
saas supabase rls posts --policy public-read

# Migrations
saas supabase migration "add_avatar_to_profiles" --sql "ALTER TABLE..."

# Generate TypeScript types
saas supabase types

# Database functions
saas supabase fn get_user_stats --returns json
```

### `redis` - Cache Management

Manage Redis cache and queues.

```bash
saas redis ping
saas redis info
saas redis keys "user:*"
saas redis get "session:abc123"
saas redis set "cache:data" '{"key":"value"}' --ttl 3600
saas redis del "cache:data"
saas redis queue add jobs '{"task":"process"}'
saas redis queue pop jobs
```

### `cf` - Cloudflare Workers

Manage Cloudflare Workers and KV.

```bash
# Workers
saas cf worker list
saas cf worker deploy ./worker.js --name my-worker
saas cf worker logs my-worker

# KV
saas cf kv list
saas cf kv get MY_NAMESPACE key123
saas cf kv put MY_NAMESPACE key123 "value"
```

### `push` - Push Notifications

Send notifications via OneSignal.

```bash
saas push send --title "Hello" --message "World" --segments "All"
saas push schedule --title "Reminder" --time "2025-01-15T10:00:00Z"
saas push template list
saas push template create welcome --title "Welcome!" --message "Thanks for joining"
```

### `flags` - Feature Flags

Manage feature flags via PostHog.

```bash
saas flags list
saas flags get dark-mode
saas flags set dark-mode --enabled --percent 50
saas flags add-user dark-mode user123
saas flags remove-user dark-mode user123
```

### `video` - Video Processing

FFmpeg-based video operations.

```bash
saas video info input.mp4
saas video thumbnail input.mp4 --time 00:00:05 --output thumb.jpg
saas video resize input.mp4 --width 1280 --height 720
saas video compress input.mp4 --quality medium
saas video trim input.mp4 --start 00:00:10 --end 00:00:30
saas video combine video1.mp4 video2.mp4 --output merged.mp4
```

### `init` - Project Scaffolding

Initialize new projects.

```bash
saas init flutter my-app --template saas
saas init supabase --project my-app
saas init worker my-edge-function
saas init add riverpod,drift,freezed
```

## Environment Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `CONTEXT7_API_KEY` | Context7 API key | `docs` commands |
| `PERPLEXITY_API_KEY` | Perplexity API key | `ask` commands |
| `SUPABASE_PROJECT_REF` | Supabase project reference | `supabase` commands |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | `supabase` commands |
| `REDIS_URL` | Redis connection URL | `redis` commands |
| `CF_API_TOKEN` or `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `cf` commands |
| `ONESIGNAL_APP_ID` | OneSignal app ID | `push` commands |
| `ONESIGNAL_API_KEY` | OneSignal API key | `push` commands |
| `POSTHOG_API_KEY` | PostHog API key | `flags` commands |
| `POSTHOG_PROJECT_ID` | PostHog project ID | `flags` commands |

Create a `.env` file in your project root or set these in your shell configuration.

## Global Options

```bash
--json      Output results as JSON
-v, --verbose   Enable verbose output
--debug     Enable debug output
-V, --version   Display version number
-h, --help      Display help
```

## Configuration

The CLI stores configuration in `~/.config/saas-cli/`:

- `config.yaml` - CLI settings
- `cache/` - Response cache for faster lookups

## Security Notes

This CLI executes external tools (FFmpeg, Wrangler, Flutter, Supabase CLI) via shell commands. Ensure you trust the input you provide, especially for:

- Project names in `init` commands
- File paths in `video` commands
- Custom arguments passed to backend CLIs

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

```bash
# Clone and install
git clone https://github.com/Beaulewis1977/saas-cli.git
cd saas-cli
pnpm install

# Run in development
pnpm dev

# Run tests
pnpm test

# Build
pnpm build
```

## License

MIT License - see [LICENSE](LICENSE)

## Author & Support

**Designed and built by Beau Lewis**

- Email: blewisxx@gmail.com
- GitHub: [@Beaulewis1977](https://github.com/Beaulewis1977)

If you find this useful and want to support continued development:

- Venmo: [@BeauinTulsa](https://venmo.com/BeauinTulsa)
- Ko-fi: [ko-fi.com/beaulewis](https://ko-fi.com/beaulewis)
