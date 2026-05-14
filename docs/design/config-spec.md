# Gant-Agent 配置规范

> 版本: v1.0.0-draft

---

## 1. 配置总览

Gant-Agent 使用两个核心配置文件：

| 文件 | 作用 | 位置 |
|------|------|------|
| `gant.yaml` | 声明式配置：定义知识源和 Profile | `~/.gant-agent/gant.yaml` |
| `gant.lock` | 锁定文件：记录精确版本 | `~/.gant-agent/gant.lock` |

---

## 2. `gant.yaml` 格式

```yaml
# gant.yaml — Gant-Agent 主配置文件
version: '1.0'                    # 配置格式版本

# ─────────────────────────────────────────
# 知识源定义（类似 npm 的 dependencies）
# ─────────────────────────────────────────
sources:
  # 业务知识库（Wiki）
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: main                  # 可以是 branch、tag 或 commit SHA
    path: skills/                  # 仓库中 skill 所在的子目录（可选，默认自动检测）

  # 技术技能包
  frontend-v2:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: framework-v2          # 跟踪特定分支
    path: frontend/framework-v2/   # 只取这个子目录

  backend:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: main
    path: backend/

  # 本地目录（开发调试用）
  my-local-skills:
    localPath: ~/Code/my-skills     # 本地路径，直接符号链接，不 clone

# ─────────────────────────────────────────
# Profile 定义：Skill 组合
# ─────────────────────────────────────────
profiles:
  # 默认配置（新员工入职）
  default:
    - yadea-bom

  # 前端开发
  frontend:
    - yadea-bom
    - frontend-v2

  # 后端开发
  backend-dev:
    - yadea-bom
    - backend

  # 全栈
  fullstack:
    - yadea-bom
    - frontend-v2
    - backend

# ─────────────────────────────────────────
# 全局设置（可选）
# ─────────────────────────────────────────
settings:
  # OMC 配置路径
  omcConfigPath: ~/.config/opencode/oh-my-openagent.json

  # Agent 目录映射（高级配置，通常不需要修改）
  agentPaths:
    opencode: ~/.opencode/skills
    claude: ~/.claude/skills
    cursor: ~/.cursor/skills

  # 链接策略：symlink | hardlink | copy
  linkStrategy: symlink

  # 是否自动更新（检测到新 commit 时提示）
  autoCheckUpdate: true
```

---

## 3. 字段详解

### 3.1 `sources` — 知识源

每个 source 是一个独立的知识库，可以是远程 Git 仓库或本地目录。

#### 远程仓库（`repo`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `repo` | string | ✅ | Git 仓库 URL（支持 SSH/HTTPS） |
| `version` | string | ✅ | 版本约束：`branch`、`tag` 或完整 `commit SHA` |
| `path` | string | ❌ | 仓库内子目录，只取该目录下的 skills |

#### 本地目录（`localPath`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `localPath` | string | ✅ | 本地绝对或相对路径（支持 `~` 展开） |

> **注意**：每个 source 必须且只能有 `repo` 或 `localPath` 之一。

### 3.2 `profiles` — 组合配置

Profile 是一组 source 的集合，定义了不同角色需要加载的知识组合。

| 字段 | 类型 | 说明 |
|------|------|------|
| Profile 名 | string[] | 该 Profile 包含的 source 名称列表（引用 `sources` 的 key） |

**规则：**
- Profile 名只能包含字母、数字、连字符（`-`）、下划线（`_`）
- Source 在 Profile 中的顺序决定了加载优先级（后加载的覆盖先加载的）
- 同名 Skill 冲突时，后加载的 source 中的 Skill 优先

### 3.3 `settings` — 全局设置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `omcConfigPath` | string | `~/.config/opencode/oh-my-openagent.json` | OMC 配置文件路径 |
| `agentPaths` | object | 见上方示例 | 各 Agent 的 skills 目录 |
| `linkStrategy` | string | `symlink` | 文件链接策略 |
| `autoCheckUpdate` | boolean | `true` | 是否自动检查上游更新 |

---

## 4. `gant.lock` 格式

```yaml
# gant.lock — 由 gant sync 自动生成，不要手动修改
version: '1.0'
generatedAt: '2026-05-14T10:30:00Z'

sources:
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    resolvedVersion: main
    resolvedCommit: abc123def4567890abcdef1234567890abcdef12  # 40 位完整 SHA
    path: skills/
    skills:                      # 检测到的所有 Skill
      - name: bom-query
        path: skills/bom-query/
      - name: change-management
        path: skills/change-management/

  frontend-v2:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    resolvedVersion: framework-v2
    resolvedCommit: def789abc1234567890abcdef1234567890abcdef
    path: frontend/framework-v2/
    skills:
      - name: react-hooks
        path: frontend/framework-v2/react-hooks/

profiles:
  default:
    active: true                 # 当前激活的 Profile
    linkedSkills:
      - name: bom-query
        source: yadea-bom
        targetPath: ~/.gant-agent/profiles/default/bom-query
```

**锁定文件的作用：**
1. **版本锁定**：记录实际解析到的 commit SHA，确保团队环境一致
2. **Skill 清单**：记录每个 source 中检测到的所有 Skill
3. **链接追踪**：记录当前 Profile 中哪些 Skill 被链接到哪里
4. **幂等性**：`gant sync` 读取 lock 文件，只执行必要的变更

---

## 5. 本地目录结构

```bash
~/.gant-agent/                          # Gant-Agent 主目录
├── gant.yaml                           # 用户配置文件
├── gant.lock                           # 锁定文件（自动生成的精确版本）
├── cache/                              # 远程仓库缓存
│   ├── yadea-bom@abc123de/            # 按 source 名 + commit 前 8 位
│   │   └── skills/
│   ├── gant-skills@def789ab/          # 同一仓库不同版本分别缓存
│   │   ├── frontend/
│   │   └── backend/
│   └── ...
├── profiles/                           # Profile 实例（符号链接）
│   ├── default/                        # default Profile 的 skills
│   │   ├── bom-query -> ../../cache/yadea-bom@abc123de/skills/bom-query
│   │   └── change-management -> ../../cache/yadea-bom@abc123de/skills/change-management
│   ├── frontend/                       # frontend Profile
│   │   ├── bom-query -> ../../cache/yadea-bom@abc123de/skills/bom-query
│   │   └── react-hooks -> ../../cache/gant-skills@def789ab/frontend/framework-v2/react-hooks
│   └── ...
└── logs/                               # 操作日志
    └── sync-2026-05-14.log
```

**设计原则：**
- `cache/`：隔离存放各 source 的原始内容，按 commit SHA 区分版本
- `profiles/`：每个 Profile 一个目录，里面是到 `cache/` 的符号链接
- OMC 的 skills 路径指向 `~/.gant-agent/profiles/<active-profile>/`

---

## 6. OMC 集成方式

```mermaid
graph LR
    A[OMC 配置] -->|skills 扫描路径| B[~/.gant-agent/profiles/default/]
    B -->|符号链接| C[cache/yadea-bom@abc123de/]
    B -->|符号链接| D[cache/gant-skills@def789ab/]
```

**集成方式：**
1. `gant use <profile>` 将 `~/.gant-agent/profiles/<profile>` 设置为 OMC 的 skills 路径
2. 或者直接修改 OMC 配置，添加 `"~/.gant-agent/profiles/default"` 到 skills 扫描路径

---

## 7. 配置校验规则

`gant.yaml` 必须满足以下规则：

1. **source 名称唯一**：`sources` 中每个 key 不能重复
2. **source 类型唯一**：每个 source 只能有 `repo` 或 `localPath` 之一
3. **version 必填**：远程仓库必须有 `version` 字段
4. **Profile 引用有效**：`profiles` 中引用的 source 名必须在 `sources` 中定义
5. **Profile 名合法**：只能包含 `[a-zA-Z0-9_-]`

---

## 8. 示例：最小配置

```yaml
version: '1.0'
sources:
  wiki:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: main

profiles:
  default:
    - wiki
```

这是最小可用配置，只加载业务知识库，适合全员默认使用。

---

## 9. 示例：完整配置

```yaml
version: '1.0'
sources:
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: '^1.0.0'
    path: skills/

  frontend-v2:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: framework-v2
    path: frontend/framework-v2/

  backend:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: main
    path: backend/

  local-dev:
    localPath: ~/Code/my-skills

profiles:
  default:
    - yadea-bom

  frontend:
    - yadea-bom
    - frontend-v2

  backend-dev:
    - yadea-bom
    - backend

  fullstack:
    - yadea-bom
    - frontend-v2
    - backend

  dev:
    - yadea-bom
    - frontend-v2
    - backend
    - local-dev

settings:
  linkStrategy: symlink
  autoCheckUpdate: true
```

---

## 10. 版本演进计划

| 版本 | 新增能力 | 向后兼容 |
|------|----------|----------|
| v1.0 | 基础配置、单仓库、符号链接 | - |
| v1.1 | 支持 `localPath` | ✅ 兼容 v1.0 |
| v1.2 | 支持 `settings.linkStrategy`（hardlink/copy） | ✅ 兼容 |
| v2.0 | 传递依赖、semver 解析 | ❌ 可能不兼容 |

---

## 附录：与现有工具对比

| 特性 | Gant-Agent | Microsoft APM | SKM |
|------|-----------|---------------|-----|
| 配置位置 | `~/.gant-agent/gant.yaml` | 项目级 `apm.yml` | `~/.config/skm/skills.yaml` |
| 作用域 | 用户级（全局） | 项目级 | 用户级 |
| 版本锁定 | `gant.lock`（commit SHA） | `apm.lock.yaml` | `skills-lock.yaml` |
| 多源组合 | ✅ Profile | ✅ 依赖解析 | ❌ 无组合 |
| 本地路径 | ✅ `localPath` | ❌ | ✅ `local_path` |
| 传递依赖 | ❌（v1 不做） | ✅ | ❌ |
| 安全扫描 | ❌（内部仓库信任） | ✅ | ❌ |
| OMC 集成 | ✅ 原生支持 | 通用多 Agent | 通用多 Agent |

**核心差异**：Gant-Agent 是「企业内业务知识分发器」，配置简单、无治理负担、原生适配 OMC。
