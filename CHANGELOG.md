# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-14

### Added
- Initial release of Gant-Agent
- CLI commands: `init`, `sync`, `use`, `status`, `doctor`, `list`
- Support for two source types: remote Git repos and local paths
- Profile-based skill combination management
- Lockfile mechanism for reproducible deployments
- Symbolic link-based skill activation
- Comprehensive error handling with actionable suggestions
- 46 unit tests covering core modules
- Skill conflict auto-rename when duplicate names exist within a profile
- Frontmatter validation with warnings for malformed skills
- Scan depth limit (5) and excluded directory blacklist

### Features
- `gant init` — Interactive configuration initialization with templates, supports `--local` for project-level config
- `gant sync` — Clone/fetch repos, detect Skills, filter invalid frontmatter, handle conflicts, generate lockfile
- `gant use <profile>` — Switch active skill profile with project-level agent detection
- `gant status` — Display current configuration state and detected project-level agents
- `gant doctor` — Environment diagnostics with agent detection
- `gant list` — List all Skills in the active profile

### Technical
- TypeScript 5.3 with strict mode
- Vitest for testing
- Commander.js for CLI framework
- simple-git for Git operations
- js-yaml for configuration parsing
- Project-level config auto-detection (walks up from cwd)
- Multi-agent support: OpenCode, Claude, Cursor, Qoder
