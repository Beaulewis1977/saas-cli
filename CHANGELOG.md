# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2025-01-09

### Added

- **Project-level `.env` support**: The CLI now automatically loads environment variables from a `.env` file in the current directory, allowing per-project API key configuration.
- **CLI existence checks**: Commands that require external CLIs (Flutter, Wrangler, Supabase, FFmpeg) now check if the CLI is installed before running and display helpful installation instructions if missing.
- **Input validation utilities**: New validation functions for SQL identifiers, project names, file paths, timestamps, resolutions, and CRF values.
- **Path traversal protection**: Output file paths are now validated to prevent writing outside the project directory.
- **Comprehensive test suite**: Added 43 new tests for security utilities (107 total tests).

### Changed

- **Improved error messages**: Commands now show clear, actionable error messages when external CLIs are not installed, including installation instructions.
- **README documentation**: Expanded Requirements section with detailed table of external CLI dependencies and installation commands.

### Security

- **Fixed command injection vulnerabilities**: Replaced `exec()` with `execFile()` across all commands that spawn external processes (`video`, `cf`, `init`, `supabase`). Arguments are now passed as arrays instead of interpolated strings.
- **Fixed SQL injection vulnerabilities**: Added identifier validation in `column-parser.ts` and RLS policy generation. Table names, column names, and foreign key references are now validated before SQL generation.
- **Fixed path traversal vulnerabilities**: Added `validateOutputPath()` to all code generation commands (`gen drift`, `gen powersync`, `gen riverpod`, `gen freezed`, `gen gorouter`, `gen repository`) and Supabase type generation.

### Files Changed

**New files:**
- `src/utils/exec.ts` - Safe command execution wrapper with CLI detection
- `src/utils/validation.ts` - Input validation functions
- `src/utils/path.ts` - Path traversal protection
- `tests/unit/utils/exec.test.ts` - Tests for exec utilities
- `tests/unit/utils/validation.test.ts` - Tests for validation utilities
- `tests/unit/utils/path.test.ts` - Tests for path utilities

**Modified files:**
- `src/commands/video/index.ts` - execFile, input validation
- `src/commands/cf/index.ts` - execFile, parameter validation
- `src/commands/init/index.ts` - execFile, CLI checks, project name validation
- `src/services/supabase.ts` - execFile, identifier validation, path validation
- `src/utils/column-parser.ts` - SQL identifier validation
- `src/commands/gen/drift.ts` - path validation
- `src/commands/gen/powersync.ts` - path validation
- `src/commands/gen/riverpod.ts` - path validation
- `src/commands/gen/freezed.ts` - path validation
- `src/commands/gen/gorouter.ts` - path validation
- `src/commands/gen/repository.ts` - path validation
- `src/commands/supabase/index.ts` - path validation, name validation

## [1.0.0] - 2025-01-08

### Added

- Initial release of saas-cli
- Documentation lookup via Context7 (`docs` command)
- AI-powered questions via Perplexity (`ask` command)
- Code generation for Riverpod, Drift, GoRouter, Freezed, PowerSync, Repository pattern (`gen` command)
- Supabase management: schema, RLS policies, migrations, functions, types (`supabase` command)
- Redis cache management (`redis` command)
- Cloudflare Workers management (`cf` command)
- Push notifications via OneSignal (`push` command)
- Feature flags via PostHog (`flags` command)
- Video processing via FFmpeg (`video` command)
- Project scaffolding (`init` command)

[Unreleased]: https://github.com/Beaulewis1977/saas-cli/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/Beaulewis1977/saas-cli/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Beaulewis1977/saas-cli/releases/tag/v1.0.0
