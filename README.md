<div align="center">

# saas-cli

**A unified CLI for Flutter SaaS development**

Live documentation · AI-powered assistance · Code generation · Backend integrations

[![npm version](https://img.shields.io/npm/v/@beaulewis/saas-cli.svg?style=flat-square)](https://www.npmjs.com/package/@beaulewis/saas-cli)
[![license](https://img.shields.io/npm/l/@beaulewis/saas-cli.svg?style=flat-square)](https://github.com/Beaulewis1977/saas-cli/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Beaulewis1977/saas-cli/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Beaulewis1977/saas-cli/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/@beaulewis/saas-cli.svg?style=flat-square)](https://nodejs.org)

</div>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [docs](#docs---documentation-lookup)
  - [ask](#ask---ai-powered-questions)
  - [gen](#gen---code-generation)
  - [supabase](#supabase---database-management)
  - [redis](#redis---cache-management)
  - [cf](#cf---cloudflare-workers)
  - [push](#push---push-notifications)
  - [flags](#flags---feature-flags)
  - [video](#video---video-processing)
  - [init](#init---project-scaffolding)
- [Environment Variables](#environment-variables)
- [Configuration](#configuration)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Documentation** | Query Flutter, Dart, and package docs via Context7 |
| **AI-Powered Questions** | Ask technical questions with Perplexity AI |
| **Code Generation** | Generate Riverpod, Drift, GoRouter, Freezed, and more |
| **Supabase Management** | RLS policies, migrations, types, functions |
| **Backend Services** | Redis, Cloudflare Workers, OneSignal, PostHog |
| **Video Processing** | FFmpeg-based video operations |

---

## Installation

```bash
# Global install via npm
npm install -g @beaulewis/saas-cli

# Global install via pnpm
pnpm add -g @beaulewis/saas-cli

# Run without installing
npx @beaulewis/saas-cli --help
```

Verify installation:

```bash
saas --version
```

<details>
<summary><strong>Install from source</strong></summary>

```bash
git clone https://github.com/Beaulewis1977/saas-cli.git
cd saas-cli
pnpm install
pnpm build
pnpm link --global
```

</details>

---

## Quick Start

```bash
# Look up Flutter documentation
saas docs flutter "ListView.builder with pagination"

# Ask AI a question
saas ask "best practices for offline-first Flutter apps"

# Generate a Riverpod notifier
saas gen riverpod notifier UserList --state "List<User>"
```

---

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

**Available Models:**

| Model | Use Case |
|-------|----------|
| `sonar` | Fast, general queries (default) |
| `sonar-pro` | Enhanced responses |
| `sonar-reasoning` | Complex problem solving |
| `sonar-deep-research` | In-depth research |

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

---

## Environment Variables

Create a `.env` file in your project root or set these in your shell configuration.

| Variable | Description | Required For |
|----------|-------------|--------------|
| `CONTEXT7_API_KEY` | Context7 API key | `docs` |
| `PERPLEXITY_API_KEY` | Perplexity API key | `ask` |
| `SUPABASE_PROJECT_REF` | Supabase project reference | `supabase` |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | `supabase` |
| `REDIS_URL` | Redis connection URL | `redis` |
| `CF_API_TOKEN` | Cloudflare API token | `cf` |
| `ONESIGNAL_APP_ID` | OneSignal app ID | `push` |
| `ONESIGNAL_API_KEY` | OneSignal API key | `push` |
| `POSTHOG_API_KEY` | PostHog API key | `flags` |
| `POSTHOG_PROJECT_ID` | PostHog project ID | `flags` |

---

## Global Options

```
--json          Output results as JSON
-v, --verbose   Enable verbose output
--debug         Enable debug output
-V, --version   Display version number
-h, --help      Display help
```

---

## Configuration

The CLI stores configuration in `~/.config/saas-cli/`:

```
~/.config/saas-cli/
├── config.yaml    # CLI settings
└── cache/         # Response cache for faster lookups
```

---

## Security Notes

This CLI executes external tools (FFmpeg, Wrangler, Flutter, Supabase CLI) via shell commands. Ensure you trust the input you provide, especially for:

- Project names in `init` commands
- File paths in `video` commands
- Custom arguments passed to backend CLIs

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

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

---

## License

[MIT License](LICENSE) - see LICENSE file for details.

---

<div align="center">

## Author

**Beau Lewis**

[![GitHub](https://img.shields.io/badge/GitHub-@Beaulewis1977-181717?style=flat-square&logo=github)](https://github.com/Beaulewis1977)
[![Email](https://img.shields.io/badge/Email-blewisxx@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:blewisxx@gmail.com)

---

### Support This Project

If you find this tool useful and want to support continued development:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/beaulewis)
[![Venmo](https://img.shields.io/badge/Venmo-@BeauinTulsa-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/BeauinTulsa)

</div>
