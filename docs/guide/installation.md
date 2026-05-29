<!-- 以下内容是给 AI 助手的指令，人类用户请按以下说明操作 -->

# 安装

**👉 给人类用户**：把下面所有内容复制粘贴到你的 AI 助手（如 Claude、Cursor）会话中，AI 会自动帮你完成安装。

```
Install and configure Gant-Agent by following the instructions here:
https://raw.githubusercontent.com/superchenwb/gant-agent/refs/heads/master/docs/guide/installation.md
```

---

# Gant-Agent 安装指南

你是帮助用户安装 Gant-Agent 的 AI 助手。

Gant-Agent 是 Gant 公司的业务技能包管理器。它将业务知识库（Wiki）和技术技能包挂载到 AI Agent 的技能目录中，让 Agent 拥有项目专属的业务知识和技术规范。

**注意**：Gant-Agent 不依赖 Oh-My-OpenAgent (omo)。它是一个独立的 CLI 工具，兼容任何读取 `~/.claude/skills/`、`~/.cursor/skills/` 或 `~/.opencode/skills/` 的 AI Agent。

---

## 第一步：检查 Gant-Agent 是否已安装

```bash
gant --version 2>/dev/null || echo "NOT_INSTALLED"
```

**如果输出类似 `0.2.0`（版本号）**：说明已安装，跳到第三步。
**如果输出 `NOT_INSTALLED` 或命令不存在**：继续第二步安装。

---

## 第二步：安装 Gant-Agent

### 2.1 检查前置环境

```bash
node --version  # 需要 >= 18
git --version   # 需要 >= 2.20
```

如果以上任一命令失败，先让用户安装对应工具，**停止并等待用户确认**。

### 2.2 安装

```bash
npm install -g gant-agent
```

如果报错 `EACCES: permission denied`，改用以下方式之一：

**方式 A：使用 sudo（需要用户输入密码）**
```bash
sudo npm install -g gant-agent
```

**方式 B：使用 npx（无需全局安装）**
```bash
npx gant-agent --version
```
> 注意：如果使用 npx，后续所有 `gant` 命令需替换为 `npx gant-agent`

安装完成后验证：

```bash
gant --version
```

---

## 第三步：初始化配置

### 3.1 确定配置级别

**向用户询问**：
> Gant-Agent 的配置应该放在项目目录下（团队共享），还是用户主目录下（个人使用）？
> 1. 项目级（推荐，配置随代码仓库共享）
> 2. 用户级（仅当前用户使用）

**等待用户回答后再继续。**

### 3.2 执行初始化

- 如果用户选择**项目级**：
  ```bash
  gant init --local
  ```
  这会创建 `./.gant-agent/gant.yaml`

- 如果用户选择**用户级**：
  ```bash
  gant init
  ```
  这会创建 `~/.gant-agent/gant.yaml`

**注意**：如果项目级初始化时当前目录不是 Git 仓库根目录，需先 `cd` 到项目根目录。

### 3.3 配置格式（可选）

如需 JSONC 格式（支持注释）：
```bash
gant init --local --jsonc
# 或
gant init --jsonc
```

---

## 第四步：配置知识源

### 4.1 询问用户需要哪些知识源

**必须向用户询问以下问题，等待回答后再继续：**

---

**问题 1：知识源类型**

> 你的知识库是远程 Git 仓库还是本地目录？
>
> 1. 远程 Git 仓库（需要 `repo` 地址）
> 2. 本地目录（需要 `localPath`，如 `../yadea-wiki/skills`）

**等待用户回答。**

---

**问题 2：业务知识库**

> 当前项目需要用到哪些业务知识库？
>
> 1. 雅迪 BOM 系统 → 远程：`git@codeup.aliyun.com:gant/wiki/yadea-wiki.git` / 本地：`../yadea-wiki/skills`
> 2. 跳过 / 其他（请提供仓库地址或本地路径）

**等待用户回答。**

---

**问题 3：技术技能包**

> 需要加载公司通用的技术技能包吗？
>
> 1. 是 → 远程：`git@codeup.aliyun.com:gant/Project-AI/gant-skills.git` / 本地：`../gant-skills`
> 2. 否 → 跳过

**等待用户回答。**

---

**问题 4：需要哪些类型的技术技能**

> `gant-skills` 仓库包含前端、后端、测试、顾问等多种技术技能。
> 你的项目需要哪些类型？（可多选）
>
> 1. 前端开发（React、Vue、ExtJS 等）
> 2. 后端开发（Java、微服务等）
> 3. 测试相关
> 4. 顾问/业务分析
> 5. 全部都要
> 6. 暂时不确定 → 跳过，后续手动配置 `exclude`
>
> **提示**：如果项目只用 React 2.0 框架，建议选择「1. 前端开发」，系统会自动排除 Vue、ExtJS 等不需要的 skill。

**等待用户回答。**

根据用户选择，在生成的配置文件中加入 `exclude` 排除不需要的目录：
- 只选前端 → `exclude: [后端, 数据库, 测试, 文档类]`
- 只选后端 → `exclude: [前端, 测试, 文档类]`
- 选择多个 → 排除未选的类型
- 全部都要 或 不确定 → 不添加 `exclude`

---

**问题 5：Git 访问方式确认（仅远程仓库）**

> 如果选择了远程仓库，你的 SSH Key 已配置到 Codeup 吗？
> 1. 是（使用 SSH 地址）
> 2. 否（使用 HTTPS 地址，如 `https://codeup.aliyun.com/gant/wiki/yadea-wiki.git`）
> 3. 本地目录（跳过此问题）

**等待用户回答。** 如果用户选择 HTTPS，将问题 2 和问题 3 中的仓库地址替换为 HTTPS 格式。如果用户选择本地目录，跳过此问题。

---

### 4.2 生成配置文件

根据用户的回答，生成配置文件。使用以下命令模板（根据 3.1 确定的配置级别选择路径）：

**根据用户选择的类型，生成对应的配置：**

#### 远程仓库配置模板

```yaml
version: '1.0'

sources:
  <知识库名称>:
    repo: <Git 仓库地址>
    version: master
    path: skills/

profiles:
  default:
    - <知识库名称>
```

#### 本地目录配置模板

```yaml
version: '1.0'

sources:
  <知识库名称>:
    localPath: <本地绝对路径或相对路径>

profiles:
  default:
    - <知识库名称>
```

**路径说明**：
- `localPath` 支持绝对路径（如 `/home/user/yadea-wiki/skills`）或相对路径（如 `../yadea-wiki/skills`）
- 相对路径基于配置文件所在目录：
  - 项目级配置：相对 `./.gant-agent/gant.yaml` 所在目录（即项目根目录）
  - 用户级配置：相对 `~/.gant-agent/gant.yaml` 所在目录（即用户主目录）

### 4.3 排除不需要的 Skill 目录

如果某个知识源包含多种技术栈，但你只需要其中一部分，可以使用 `exclude` 排除特定目录。

**适用场景**：
- 公司技能库包含 `Vue`、`React`、`ExtJS` 等多种前端框架，但你的项目只用 React
- 技能库包含大量后端技能，但前端项目不需要

**用法**：在 source 配置中添加 `exclude` 数组，列出要跳过的目录名。

```yaml
sources:
  gant-skills:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: master
    path: /
    exclude:
      - Vue
      - ExtJS
```

**工作原理**：`gant sync` 扫描 skill 时，会跳过 `exclude` 中指定的目录名（精确匹配）。被排除目录下的所有 skill 不会被检测、不会进入 lock 文件、也不会被链接到 Profile 中。

---

**示例 1：远程仓库（雅迪 BOM + 技术技能包）**
```yaml
version: '1.0'

sources:
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: master
    path: skills/
  gant-skills:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: master
    path: /

profiles:
  default:
    - yadea-bom
    - gant-skills
```

**示例 1b：排除特定技术栈（如排除 Vue 和 ExtJS）**
```yaml
version: '1.0'

sources:
  yadea-bom:
    repo: git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
    version: master
    path: skills/
  gant-skills:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: master
    path: /
    exclude:
      - Vue
      - ExtJS

profiles:
  default:
    - yadea-bom
    - gant-skills
```

**示例 2：本地目录（项目内知识库）**
```yaml
version: '1.0'

sources:
  yadea-bom:
    localPath: ../yadea-wiki/skills
  gant-skills:
    localPath: ../gant-skills

profiles:
  default:
    - yadea-bom
```

**示例 3：混合（本地业务知识 + 远程技术技能包）**
```yaml
version: '1.0'

sources:
  yadea-bom:
    localPath: ../yadea-wiki/skills
  gant-skills:
    repo: git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
    version: master
    path: /
    exclude:
      - Vue

profiles:
  default:
    - yadea-bom
    - gant-skills
```

---

## 第五步：同步知识库

### 5.1 检查 SSH 连通性（仅 SSH 方式）

```bash
ssh -T git@codeup.aliyun.com
```

如果返回 `Welcome to Codeup` 或类似成功信息，继续。
如果返回 `Permission denied` 或超时，**停止并告知用户**：
> 请配置 SSH Key：
> 1. 生成密钥：`ssh-keygen -t ed25519 -C "your-email@example.com"`
> 2. 复制公钥：`cat ~/.ssh/id_ed25519.pub`
> 3. 添加到 Codeup 个人设置 → SSH 公钥
> 4. 重试 `ssh -T git@codeup.aliyun.com`

### 5.2 执行同步

```bash
gant sync
```

这会：
1. 克隆/更新所有配置的 Git 仓库
2. 自动检测仓库中的 Skill
3. 生成锁定文件 `gant.lock`

### 5.3 验证同步结果

```bash
gant status
```

确认输出中包含：
- `锁定文件: ✓ 存在`
- `Skill 仓库同步状态: N 个源, N 个 skills`

如果同步失败，查看故障排除部分。

---

## 第六步：查看自动检测的分类

```bash
gant list --auto
```

示例输出：
```
  react (17 skills from gant-skills)
  vue (10 skills from gant-skills)
  frontend (26 skills from gant-skills)
  backend (37 skills from gant-skills)
  yadea (5 skills from yadea-bom)
```

**向用户展示输出，并询问**：
> 根据检测到的分类，你想激活哪个 Profile？
> 常用选项：
> - `react` — React 前端开发
> - `vue` — Vue 前端开发
> - `frontend` — 所有前端相关
> - `backend` — 后端开发
> - `yadea` / `bom` — 雅迪业务知识
> - `default` — 手动配置的默认 Profile
>
> **可以同时选择多个，用逗号分隔**（例如：`react,yadea`）

**等待用户回答后再继续。**

---

## 第七步：激活 Profile

根据用户选择执行：

### 单 Profile

```bash
gant use <用户选择的分类名>
```

例如：
```bash
gant use react
gant use vue
gant use backend
gant use yadea
gant use default
```

### 组合 Profile（同时激活多个）

如果用户选择了多个分类（如 `react,yadea`），用逗号分隔一次性激活：

```bash
gant use react,yadea
```

这会创建一个组合 Profile `react+yadea`，包含所有指定的 skills（自动去重）。

**注意**：不要分别执行 `gant use react` 和 `gant use yadea`，因为 `gant use` 是覆盖式的，后执行的会覆盖前一个。

---

## 第八步：验证

确认 Agent 是否正确加载了知识。

### 8.1 检查 skills 是否链接成功

**注意**：如果项目目录下没有 Agent 配置（如未安装过 Claude/Cursor），链接会创建在全局目录。使用以下命令检查：

```bash
# 优先检查项目级 Agent 目录
if [ -d ./.claude/skills/ ]; then
    ls ./.claude/skills/
elif [ -d ~/.claude/skills/ ]; then
    ls ~/.claude/skills/
else
    echo "未找到 Agent skills 目录"
fi
```

应能看到 skills 的符号链接。例如：
```
architect -> /path/to/.gant-agent/profiles/...
vue-best-practices -> /path/to/.gant-agent/profiles/...
```

### 8.2 关于项目级 vs 全局 Agent 目录

**重要提醒**：
- **项目级 Agent 目录**（`./.claude/skills/`）：仅当前项目可用，多个项目互不干扰（推荐）
- **全局 Agent 目录**（`~/.claude/skills/`）：所有项目共享，切换项目时可能导致 skills 混杂

**建议**：在常用项目根目录手动创建 Agent 目录，实现项目隔离：

```bash
# 在项目根目录创建 Claude skills 目录
mkdir -p ./.claude/skills

# 重新激活 Profile
gant use <profile>
```

现在你在 AI Agent 中提问时，它会自动加载对应的业务知识。

---

## 日常维护

### 更新知识库

当知识库有更新时：

```bash
gant sync
```

### 切换技术栈

```bash
gant list --auto            # 查看可用分类
gant use <profile>          # 切换到单个 Profile
gant use <profile1>,<profile2>  # 组合多个 Profile（如 react,yadea）
```

### 检查环境

```bash
gant doctor
```

### 删除 Profile

当某个 Profile 不再需要时：

```bash
gant remove <profile>
```

这会：
1. 删除 Agent 技能目录下指向该 Profile 的符号链接
2. 删除 Profile 目录下的所有 skills 链接
3. 删除 Profile 目录本身
4. 从锁定文件中移除该 Profile 记录

### 卸载 Gant-Agent

如需完全清理：

```bash
gant uninstall
```

这会删除所有配置、缓存和符号链接。之后如需移除 gant-agent 本身：

```bash
npm uninstall -g gant-agent
```

---

## 故障排除

### 问题 1：`npm install -g` 权限失败

**现象**：`EACCES: permission denied`

**解决**：
```bash
# 方式 1：使用 sudo
sudo npm install -g gant-agent

# 方式 2：使用 npx（推荐，无需全局安装）
npx gant-agent <command>
```

### 问题 2：`gant sync` 克隆失败

**现象**：`Permission denied (publickey)` 或 `Could not resolve host`

**解决**：
```bash
# 检查 SSH Key
ssh -T git@codeup.aliyun.com

# 检查网络
ping codeup.aliyun.com

# 查看详细诊断
gant doctor
```

### 问题 3：Skills 未生效

**现象**：Agent 没有使用业务知识回答问题

**解决**：
```bash
# 1. 检查 Profile 是否激活
gant status

# 2. 检查 Agent 技能目录是否有链接
# 项目级：ls ./.claude/skills/
# 用户级：ls ~/.claude/skills/

# 3. 重新激活
gant use <profile>

# 4. 重启 Agent 或 IDE
```

### 问题 4：配置格式错误

**现象**：`gant sync` 报错 `Invalid config`

**解决**：
```bash
# 验证配置
gant doctor

# 重新初始化（覆盖配置，保留缓存）
gant init --force        # 用户级
gant init --local --force # 项目级
```

### 问题 5：权限不足

**现象**：`EACCES` 或 `EPERM`

**解决**：
```bash
# 项目级
chmod -R u+rw ./.gant-agent/

# 用户级
chmod -R u+rw ~/.gant-agent/
```

---

## 配置文件位置

| 文件 | 用户级 | 项目级 |
|------|--------|--------|
| 主配置 | `~/.gant-agent/gant.yaml` | `./.gant-agent/gant.yaml` |
| 锁定文件 | `~/.gant-agent/gant.lock` | `./.gant-agent/gant.lock` |
| 缓存目录 | `~/.gant-agent/cache/` | `./.gant-agent/cache/` |
| Profile 目录 | `~/.gant-agent/profiles/` | `./.gant-agent/profiles/` |
| Agent 链接 | `~/.claude/skills/` | `./.claude/skills/` |

**项目级优先**：如果同时存在用户级和项目级配置，Agent 优先使用项目级的 skills。
