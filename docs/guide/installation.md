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
---

## 交互规范（AI 助手必读）

本文档包含多个需要用户决策的交互点。每个交互点使用 **Gant-Question** 格式，你必须严格遵守：

### 格式要求

```
D<N> — <one-line question title>
Project/branch: <1 short grounding sentence>
ELI10: <plain English a 16-year-old could follow, 2-4 sentences, name the stakes>
Stakes if we pick wrong: <one sentence on what breaks>
Recommendation: <choice> because <one-line reason>
Pros / cons:
A) <option label> (recommended)
  ✅ <pro — concrete, observable>
  ❌ <con — honest>
B) <option label>
  ✅ <pro>
  ❌ <con>
Net: <one-line synthesis>
```

**规则：**
- **D-numbering**：第一个问题是 `D1`，依次递增。有依赖关系时仍使用顺序编号（如 `D2` 问完后根据回答决定是否询问 `D3`）。
- **`<gant-qid:...>` 标记**：每个 AskUserQuestion 的 `question` 字段必须嵌入唯一标记，如 `<gant-qid:installation-config-level>`。
- **one-way 门**：标注 `[ONE-WAY]` 的决策不可逆（如配置级别、Git 方式），**必须等待用户回答，不可自动决定**。
- **two-way 门**：标注 `[TWO-WAY]` 的决策可后续调整，但首次安装时仍须询问。
- **Self-check**：在生成配置文件前，必须运行自检清单。
- **STOP**：标注 `**STOP.** Do NOT proceed until user responds.` 的地方，必须真正停止，不得继续执行后续步骤。

Gant-Agent 是 Gant 公司的业务技能包管理器。它将业务知识库（Wiki）和技术技能包挂载到 AI Agent 的技能目录中，让 Agent 拥有项目专属的业务知识和技术规范。

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

### 3.1 确定配置级别 [ONE-WAY] `D1`

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-config-level --one-way 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

调用 `AskUserQuestion`，格式如下：

```
D1 — Gant-Agent 配置级别选择 <gant-qid:installation-config-level>
Project/branch: {current_repo}
ELI10: Gant-Agent 需要一个配置文件来记录你的知识源（业务 wiki、技术技能包等）。这个文件可以放在项目目录里（团队成员都能用），也可以放在你的个人主目录里（只有你自己用）。
Stakes if we pick wrong: 选"用户级"会导致团队成员各自配置不同步，新人入职需要手动配；选"项目级"会将配置纳入版本控制，团队开箱即用。
Recommendation: 项目级（推荐）因为团队协作一致性优先
Completeness: A=10/10, B=8/10
Pros / cons:
A) 项目级（recommended）
  ✅ 配置随仓库共享，团队成员开箱即用，CI 可统一校验
  ✅ 配置变更可 review，不会随意 drift
  ❌ 需要将 .gant-agent/ 提交到版本控制
B) 用户级
  ✅ 不污染仓库，纯个人项目更灵活
  ❌ 团队成员需手动同步配置，容易 drift，新人体验差
Net: 除非是纯个人玩具项目，否则一律选项目级
```

**等待用户回答后再继续。**

**第三步：保存偏好（可选）**

询问用户：
> 是否将「配置级别」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-config-level --value <用户选择的值>
```

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

### 4.1 知识源配置决策链 [TWO-WAY] `D2-D6`

这是一个包含 5 个独立决策的 sequential chain。每个问题一个 AskUserQuestion，按顺序触发。

**依赖关系：**
- D6（Git 访问方式）仅在 D2 选择「远程 Git 仓库」时询问
- D5（技术技能类型）仅在 D4 选择「加载技术技能包」时询问
- D3 和 D4 中的仓库地址格式取决于 D2 的选择和 D6 的结果

---

#### D2 — 知识源类型 [TWO-WAY] `<gant-qid:installation-source-type>`

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-source-type 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds。

```
D2 — 知识源存储方式
Project/branch: {current_repo}
ELI10: Gant-Agent 需要从某个地方读取你的业务知识库和技术技能包。可以是远程 Git 仓库（团队共享，自动更新），也可以是本地目录（离线可用，手动管理）。
Stakes if we pick wrong: 选"远程"但网络不通会导致 sync 失败；选"本地"但目录不存在会导致配置无效。
Recommendation: 远程 Git 仓库（推荐）因为团队可自动同步更新
Completeness: A=9/10, B=8/10
Pros / cons:
A) 远程 Git 仓库（recommended）
  ✅ 团队成员自动获得最新知识，gant sync 即可更新
  ✅ 知识库变更可追踪、可 review
  ❌ 需要网络连接和 Git 访问权限（SSH/HTTPS）
B) 本地目录
  ✅ 无需网络，离线可用，完全本地控制
  ❌ 需手动复制更新，团队成员间容易版本不一致
Net: 有网络且团队协作 → 远程；纯个人离线环境 → 本地
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「知识源类型」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-source-type --value <用户选择的值>
```

---

#### D3 — 业务知识库 [TWO-WAY] `<gant-qid:installation-biz-knowledge>`

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-biz-knowledge 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

```
D3 — 业务知识库选择
Project/branch: {current_repo}
ELI10: 业务知识库存储了项目专属的业务规则、术语、流程文档等。例如雅迪 BOM 系统的业务规范。你可以选择预设的知识库，提供自己的仓库地址，或跳过。
Stakes if we pick wrong: 选错知识库会导致 Agent 给出不符合业务实际的回答；跳过则 Agent 缺乏业务上下文。
Recommendation: 根据项目实际业务选择
Note: options differ in kind, not coverage — no completeness score
Pros / cons:
A) 雅迪 BOM 系统
  ✅ 包含雅迪业务术语、BOM 规范、流程文档
  ❌ 仅限雅迪相关业务项目
B) 其他（提供仓库地址或本地路径）
  ✅ 可接入任意自定义业务知识库
  ❌ 需要手动提供地址，可能配置错误
C) 跳过
  ✅ 安装更快，后续可随时添加
  ❌ Agent 回答缺乏业务上下文，可能给出通用但不准确的建议
Net: 如果是雅迪项目 → 选 A；如果有自定义 wiki → 选 B；纯技术项目 → 选 C
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「业务知识库」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-biz-knowledge --value <用户选择的值>
```

---

#### D4 — 技术技能包 [TWO-WAY] `<gant-qid:installation-tech-skills>`

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-tech-skills 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

```
D4 — 是否加载公司技术技能包
Project/branch: {current_repo}
ELI10: gant-skills 仓库包含公司沉淀的前端、后端、测试等技术规范。加载后 Agent 会自动遵循这些规范写代码。
Stakes if we pick wrong: 不加载则 Agent 按通用规范编码，可能不符合公司标准；加载了但不排除不需要的类型会导致技能目录臃肿。
Recommendation: 加载（推荐）因为公司规范 > 通用规范
Completeness: A=9/10, B=6/10
Pros / cons:
A) 加载公司技术技能包（recommended）
  ✅ Agent 自动遵循公司技术规范（命名、架构、安全等）
  ✅ 减少 Code Review 时的规范类问题
  ❌ 需要后续通过 exclude 排除不需要的技术栈（见 D5）
B) 跳过
  ✅ 安装更快，技能目录更干净
  ❌ Agent 按通用规范编码，可能不符合公司标准
Net: 公司项目一律加载；纯外部开源项目可跳过
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「技术技能包」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-tech-skills --value <用户选择的值>
```

---

#### D5 — 技术技能类型 [TWO-WAY] `<gant-qid:installation-tech-types>`

**仅在 D4 选择「加载公司技术技能包」时询问。否则跳过。**

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-tech-types 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

```
D5 — 需要哪些类型的技术技能
Project/branch: {current_repo}
ELI10: gant-skills 仓库包含多种技术栈（前端 React/Vue/ExtJS、后端 Java/微服务、测试、顾问等）。你的项目只需要其中一部分，其他的可以排除以保持技能目录整洁。
Stakes if we pick wrong: 全部加载会导致 Agent 看到太多无关 skill，可能选错；排除过多会导致缺少需要的规范。
Recommendation: 根据项目实际技术栈精确选择
Note: options differ in kind, not coverage — no completeness score. Multi-select allowed.
Pros / cons:
A) 前端开发（React、Vue、ExtJS 等）
  ✅ 获得前端规范、组件库用法、框架特定最佳实践
  ❌ 如果项目不是前端项目则完全无用
B) 后端开发（Java、微服务等）
  ✅ 获得 API 规范、数据库设计、微服务架构指导
  ❌ 纯前端项目不需要
C) 测试相关
  ✅ 获得测试策略、用例编写规范、自动化测试指导
  ❌ 增加技能目录体积
D) 顾问/业务分析
  ✅ 获得需求分析、业务流程梳理指导
  ❌ 纯技术项目很少用到
E) 全部都要
  ✅ 一劳永逸，所有规范都可用
  ❌ 技能目录臃肿，Agent 可能加载无关 skill 干扰判断
F) 暂时不确定 → 跳过，后续手动配置 exclude
  ✅ 不阻塞安装流程
  ❌ 初期可能有技能冗余，需后续手动清理
Net: 精确选择 > 全部加载 > 不确定跳过
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「技术技能类型」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-tech-types --value <用户选择的值>
```

**根据 D5 选择在生成的配置文件中加入 `exclude**：**
- 只选前端 → `exclude: [后端, 数据库, 测试, 文档类]`
- 只选后端 → `exclude: [前端, 测试, 文档类]`
- 选择多个 → 排除未选的类型
- 全部都要 或 不确定 → 不添加 `exclude`

---

#### D6 — Git 访问方式 [ONE-WAY] `<gant-qid:installation-git-access>`

**仅在 D2 选择「远程 Git 仓库」时询问。否则跳过。**

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-git-access --one-way 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

```
D6 — Git 远程仓库访问方式
Project/branch: {current_repo}
ELI10: 远程仓库需要通过网络拉取。SSH 方式需要配置 SSH Key 到 Codeup，但更安全和方便；HTTPS 方式无需配置密钥，但每次可能需要输入密码。
Stakes if we pick wrong: SSH 未配置会导致 clone 失败；HTTPS 在企业内网可能受代理限制。选错会直接导致 D3 和 D4 的仓库地址格式错误，后续 sync 无法执行。
Recommendation: SSH（推荐）因为配置一次，永久免密
Completeness: A=10/10, B=7/10
Pros / cons:
A) SSH（recommended）
  ✅ 配置一次后免密访问，CI/CD 天然支持
  ✅ 企业内网通常对 SSH 更友好
  ❌ 需要先生成 SSH Key 并添加到 Codeup
B) HTTPS
  ✅ 无需配置 SSH Key，开箱即用
  ❌ 每次操作可能需要输入用户名密码（除非配置 credential helper）
  ❌ 某些企业代理可能限制 HTTPS 访问 Git
Net: 有 SSH Key → SSH；无 Key 且不想配置 → HTTPS
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「Git 访问方式」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-git-access --value <用户选择的值>
```

**如果用户选择 HTTPS：** 将 D3 和 D4 中的仓库地址替换为 HTTPS 格式（如 `https://codeup.aliyun.com/gant/wiki/yadea-wiki.git`）。

**如果用户选择 SSH 但后续 `gant sync` 失败：** 引导用户检查 SSH Key 配置（见第五步）。

---

### 4.2 生成配置文件前的自检清单

**在生成配置文件之前，运行以下 Self-check：**

```markdown
- [ ] D1 已回答：配置级别已确认（项目级 / 用户级）
- [ ] D2 已回答：知识源类型已确认（远程 / 本地）
- [ ] D3 已回答：业务知识库已确认（雅迪 / 其他 / 跳过）
- [ ] D4 已回答：技术技能包已确认（加载 / 跳过）
- [ ] D5 已处理：如果 D4 = "加载"，技术技能类型已选择，exclude 已确定
- [ ] D6 已回答：如果 D2 = "远程"，Git 访问方式已确认（SSH / HTTPS）
- [ ] 仓库地址格式正确：SSH 地址以 `git@` 开头，HTTPS 地址以 `https://` 开头
- [ ] 本地路径有效性：如果选本地，确认路径存在或相对于配置文件的目录
- [ ] 依赖一致性：D6（Git 方式）与 D2（远程）无矛盾
- [ ] 配置级别与当前目录一致：项目级配置时确认当前在 Git 仓库根目录
```

**如果任何一项未通过，停止并回到对应的问题重新确认。** 不要生成不完整或矛盾的配置。

---

### 4.3 生成配置文件

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

### 4.4 排除不需要的 Skill 目录

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

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-profile-select 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

调用 `AskUserQuestion`，格式如下：

```
D7 — 选择要激活的 Profile <gant-qid:installation-profile-select>
Project/branch: {current_repo}
ELI10: 根据你的知识源配置，gant-agent 自动检测到了可用的 skill 分类。你需要选择一个或多个分类激活，这样 Agent 在回答问题时才能调用对应的技能。
Stakes if we pick wrong: 选错会导致 Agent 使用不相关的技能（如前端项目加载了后端规范）；漏选会导致 Agent 缺少需要的业务知识。
Recommendation: 根据项目实际技术栈 + 业务需求选择，可多选
Completeness: A=9/10, B=5/10
Pros / cons:
A) react — React 前端开发
  ✅ 获得 React 组件规范、Hooks 最佳实践、状态管理指导
  ❌ 纯后端项目不需要
B) vue — Vue 前端开发
  ✅ 获得 Vue 组合式 API 规范、组件设计指导
  ❌ React 项目不需要
C) frontend — 所有前端相关（React + Vue + ExtJS + ...）
  ✅ 覆盖所有前端技术栈，通用前端项目适用
  ❌ 技能目录较臃肿，Agent 可能看到过多无关 skill
D) backend — 后端开发（Java、微服务等）
  ✅ 获得 API 设计、数据库、微服务架构规范
  ❌ 纯前端项目不需要
E) yadea / bom — 雅迪业务知识
  ✅ 获得雅迪 BOM 术语、业务流程、业务规则
  ❌ 非雅迪项目完全无用
F) default — 手动配置的默认 Profile
  ✅ 使用你自定义配置的 skill 组合
  ❌ 如果未自定义，可能为空或不符合预期
Net: 技术栈分类 + 业务分类组合最佳（如 react,yadea）
```

**说明**：
- 允许多选，用逗号分隔（如 `react,yadea`）
- 选择多个时会创建组合 Profile（如 `react+yadea`）
- **不要分别执行** `gant use react` 和 `gant use yadea`（覆盖式操作）

**等待用户回答后再继续。**

**第三步：保存偏好（可选）**

询问用户：
> 是否将「Profile 选择」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-profile-select --value <用户选择的值>
```

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

### 8.2 项目级 vs 全局 Agent 目录确认 [ONE-WAY] `D8`

**第一步：检查是否有已保存的偏好**

```bash
gant preference --check installation-agent-dir-level --one-way 2>/dev/null || echo "ASK_NORMALLY"
```

- 如果输出 `AUTO_DECIDE:<option>` → 直接使用该选项，**跳过询问**
- 如果输出 `ASK_NORMALLY` 或命令失败 → 继续下面的 AskUserQuestion

**第二步：询问用户（仅在需要时）**

**STOP.** Do NOT proceed until user responds.

如果 `gant use` 后 skills 链接出现在全局目录（`~/.claude/skills/`）而非项目目录（`./.claude/skills/`），必须询问用户：

```
D8 — Agent skills 目录级别确认 <gant-qid:installation-agent-dir-level>
Project/branch: {current_repo}
ELI10: Agent 加载 skills 的目录有两种：项目级（仅当前项目可用）和全局级（所有项目共享）。当前 skills 被链接到了全局目录，这意味着切换项目时 skills 会混杂。
Stakes if we pick wrong: 全局目录会导致多项目 skills 混杂（A 项目的业务知识出现在 B 项目）；项目级目录可实现完美隔离，但需要手动创建。
Recommendation: 项目级（推荐）因为多项目隔离是最佳实践
Completeness: A=10/10, B=6/10
Pros / cons:
A) 迁移到项目级目录（recommended）
  ✅ 多项目互不干扰，每个项目只加载自己的 skills
  ✅ 团队成员克隆仓库后自动获得正确的技能环境
  ❌ 需要手动创建目录并重新激活 Profile（额外 2 步）
B) 保持全局目录
  ✅ 无需额外操作，当前状态可用
  ❌ 切换项目时 skills 不会自动切换，可能导致 Agent 使用错误的业务知识
Net: 常用项目 → 项目级；一次性尝试 → 保持全局
```

**第三步：保存偏好（可选）**

询问用户：
> 是否将「Agent 目录级别」的选择保存为默认偏好？下次安装时自动应用。
> 1. 保存
> 2. 不保存

如果选择保存：
```bash
gant preference --set installation-agent-dir-level --value <用户选择的值>
```

**如果用户选择项目级：**

```bash
# 在项目根目录创建 Claude skills 目录
mkdir -p ./.claude/skills

# 重新激活 Profile（将链接从全局迁移到项目级）
gant use <profile>
```

**验证迁移成功：**

```bash
if [ -d ./.claude/skills/ ] && [ "$(ls -A ./.claude/skills/)" ]; then
    echo "✓ 项目级 Agent 目录已激活"
    ls ./.claude/skills/
else
    echo "✗ 迁移失败，仍在使用全局目录"
fi
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
