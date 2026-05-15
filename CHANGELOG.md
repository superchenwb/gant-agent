# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-05-15

### Added

- `gant use react,yadea` 组合 Profile 支持：逗号分隔多个 profile，同时激活并自动去重
- 组合 Profile 创建 `profiles/<name1>+<name2>/` 目录，包含所有指定 profile 的 skills（自动去重）

## [0.2.1] - 2026-05-15

### Added

- Auto-Profile 自动生成：基于 Skill 路径、名称、frontmatter tags 自动检测分类，`gant list --auto` 查看，`gant use react` 等直接使用
- `remove <profile>` 命令：删除指定 Profile 及其所有 Agent 符号链接
- `uninstall` 命令：完全卸载，清理所有配置和符号链接
- frontmatter `tags` 字段支持：SKILL.md 可声明 tags，auto-profile 根据 tags 生成分类
- `gant list --auto` 命令：列出所有自动检测的 Profiles

### Changed

- `gant init` 默认模板改为空配置（`sources: {}`、`profiles: default: []`），不再强制包含 yadea-bom
- `gant use` 优先使用 auto-profile，当手动 profile 和自动分类同名时显示警告
- 安装文档重写：修复 SSH 检查、npm 权限、项目级/用户级路径区分、本地目录配置示例
- Agent 链接策略优化：auto-profile 目录切换时自动清理旧链接

### Fixed

- Auto-Profile 链接 bug：从 lockfile 中记录的 source 路径直接创建符号链接，不再依赖不存在的 `profiles/<source>/` 目录
- 全局 Agent 目录混用问题：文档增加项目级目录隔离建议

## [0.2.0] - 2026-05-15

### Added

- 增强版 Doctor 命令：并行检查执行、分类诊断（System/Config/Tools/Skills）、多种输出格式（--status/--verbose/--json）
- 后台版本检查器：支持版本渠道识别（latest/beta/alpha/next/rc/canary）、本地开发模式自动检测、fetch+AbortController 异步获取、渠道级缓存
- JSONC 配置支持：配置加载器自动识别 .jsonc/.json/.yaml 格式、gant init --jsonc 创建带注释的 JSONC 配置文件
- 四层 Skill 发现机制：项目级（.gant/skills/）> 用户级（~/.gant/skills/）> 全局（~/.config/gant/skills/）> 内置，高优先级覆盖低优先级
- 高级 SKILL.md Frontmatter 解析：支持 description、triggers、tools 字段
- Postinstall 脚本：安装后自动检测环境、检查 Node.js/Bun 版本兼容性、提示初始化

### Changed

- version-check 从 execSync 改为 fetch+AbortController，支持静默失败和超时控制
- list 命令同时展示已同步 Skills 和本地发现 Skills
- 配置加载器优先查找 .jsonc，然后是 .json，最后是 .yaml

## [0.1.1] - 2026-05-14

### Added
- CLI 启动时自动检查 npm 最新版本，有新版本时提示更新
- 版本检查结果缓存（24 小时 TTL），避免频繁请求 npm

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
