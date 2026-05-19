# Gant-Agent

> 团队级 AI 业务知识库管理工具

Gant-Agent 帮助团队将业务知识库（Wiki）和技能仓库一键部署到 AI Agent 中，让团队成员的 AI 助手自动拥有项目专属的业务知识和技术规范。

## 快速开始

### 一键安装（推荐）

**把下面这段文字复制粘贴给你的 AI 助手**（Claude、Cursor、OpenCode 等），AI 会自动帮你完成安装：

```
Install and configure Gant-Agent by following the instructions here:
https://raw.githubusercontent.com/superchenwb/gant-agent/refs/heads/master/docs/guide/installation.md
```

### 手动安装

如果你更喜欢手动操作：

```bash
npm install -g gant-agent
```

### 初始化配置

```bash
# 交互式创建用户级配置（~/.gant-agent/）
gant init

# 创建项目级配置（./.gant-agent/）
gant init --local

# 或从模板创建
cp node_modules/gant-agent/templates/gant.yaml ~/.gant-agent/gant.yaml
```

### 同步知识库

```bash
# 下载所有配置的知识源
gant sync

# 预览变更（不实际执行）
gant sync --dry-run
```

### 切换 Profile

```bash
# 查看可用 Profiles
gant status

# 切换到前端开发配置
gant use frontend

# 切换到全栈配置
gant use fullstack
```

## 它能做什么

Gant-Agent 是团队级 AI **Skill 管理器**。它将分散的业务知识和技术规范打包成 AI Agent 可直接加载的 Skills，实现团队知识的标准化复用。

| 能力 | 说明 |
|------|------|
| **统一管理知识源** | 将 Wiki 仓库、技术规范库配置为 Skill 源，集中管理版本和更新 |
| **自动同步到 Agent** | 一键 `gant sync` 将远程知识库拉取并转换为本地 Skills |
| **Profile 按需切换** | 不同场景加载不同 Skill 组合（如 `frontend` / `backend` / `fullstack`） |
| **团队配置共享** | 项目级配置随代码仓库共享，新成员clone后即可拥有相同的 AI 知识环境 |

## 工作原理

```
┌─────────────────────────────────────────┐
│            知识源 (Sources)              │
├─────────────────────────────────────────┤
│  Wiki 仓库          Skills 仓库         │
│  ├── skills/        ├── frontend/       │
│  │   ├── bom-query/ │   ├── react-hooks/│
│  │   └── change/    │   └── state-mgr/  │
│  └── wiki/          ├── backend/        │
│                     └── testing/        │
└─────────────────┬───────────────────────┘
                  │  git clone / symlink
┌─────────────────▼───────────────────────┐
│          Gant-Agent 本地缓存            │
│         ~/.gant-agent/cache/            │
│    或 ./.gant-agent/cache/ (项目级)    │
└─────────────────┬───────────────────────┘
                  │  按 Profile 组合
┌─────────────────▼───────────────────────┐
│         Profile 激活目录                │
│    ~/.gant-agent/profiles/<name>/       │
│    或 ./.gant-agent/profiles/ (项目级) │
│       ├── bom-query -> cache/...        │
│       ├── react-hooks -> cache/...      │
│       └── backend -> cache/...          │
└─────────────────┬───────────────────────┘
                  │  符号链接（优先项目级）
┌─────────────────▼───────────────────────┐
│     项目级 Agent 目录（优先）            │
│  ./.opencode/skills/                    │
│  ./.claude/skills/                      │
│  ./.cursor/skills/                      │
│       ├── bom-query -> profile/...      │
│       └── react-hooks -> profile/...    │
└─────────────────────────────────────────┘
                  │  回退：全局 Agent 目录
┌─────────────────▼───────────────────────┐
│     全局 Agent 目录（回退）              │
│  ~/.opencode/skills/                    │
│  ~/.claude/skills/                      │
└─────────────────────────────────────────┘
```

## 配置示例

```yaml
version: '1.0'

sources:
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: main
    path: skills/

  frontend-v2:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: framework-v2
    path: frontend/framework-v2/

profiles:
  default:
    - yadea-bom

  frontend:
    - yadea-bom
    - frontend-v2

  fullstack:
    - yadea-bom
    - frontend-v2
```

## CLI 命令

| 命令 | 说明 |
|------|------|
| `gant init` | 初始化配置 |
| `gant sync` | 同步所有知识源 |
| `gant sync --dry-run` | 预览变更 |
| `gant use <profile>` | 切换 Profile |
| `gant status` | 查看当前状态 |
| `gant doctor` | 环境诊断 |
| `gant list` | 列出所有 Skills |
| `gant list --profile <name>` | 列出指定 Profile 的 Skills |

## 项目状态

✅ **可用阶段**

- [x] 配置规范设计（支持用户级 + 项目级）
- [x] CLI 命令框架（init, sync, use, status, doctor, list）
- [x] Git 克隆与增量更新（基于 commit SHA）
- [x] Skill 自动检测（深度限制 5，排除黑名单目录）
- [x] Profile 切换与多 Agent 同步（OpenCode / Claude / Cursor / Qoder）
- [x] **项目级 Agent 自动发现**（优先在项目目录创建 symlink）
- [x] 版本锁定机制（gant.lock）
- [x] Skill 冲突自动重命名
- [x] Skill 前端质量校验（过滤无效 frontmatter）
- [x] 环境诊断
- [x] 46 个单元测试
- [x] CI/CD 配置

## 相关项目

- [yadea-wiki](git@codeup.aliyun.com:gant/wiki/yadea-wiki.git) — 雅迪 BOM 业务知识库示例

## License

MIT