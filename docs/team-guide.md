# Gant-Agent 团队使用指南

## 1. 安装

```bash
npm install -g gant-agent
```

安装完成后，验证：

```bash
gant --version
gant doctor
```

## 2. 初始化配置

```bash
gant init
```

这会创建 `~/.gant-agent/gant.yaml` 配置文件。

## 3. 编辑配置

打开 `~/.gant-agent/gant.yaml`，配置你们的知识源：

```yaml
version: '1.0'

sources:
  # 业务知识库（Wiki）
  company-wiki:
    repo: git@codeup.aliyun.com:your-company/wiki.git
    version: main
    path: skills/        # Skill 存放在仓库的 skills/ 目录下

  # 技术规范
  tech-specs:
    repo: git@codeup.aliyun.com:your-company/tech-skills.git
    version: main

profiles:
  default:
    - company-wiki

  frontend:
    - company-wiki
    - tech-specs
```

### 配置说明

| 字段 | 说明 |
|------|------|
| `repo` | Git 仓库地址（支持 SSH） |
| `version` | 分支或标签名 |
| `path` | Skill 在仓库中的子路径（可选） |
| `profiles` | 定义不同角色的 Skill 组合 |

## 4. 同步知识库

```bash
# 首次同步（会克隆所有仓库）
gant sync

# 后续同步（只更新变化的仓库）
gant sync

# 预览变更（不实际执行）
gant sync --dry-run

# 查看详细日志
gant sync --verbose
```

## 5. 切换 Profile

```bash
# 查看可用 Profiles
gant status

# 切换到前端配置
gant use frontend

# 切换到默认配置
gant use default
```

切换后，Agent 会自动加载该 Profile 的所有 Skills。

## 6. 查看 Skills

```bash
# 查看所有 Skills
gant list

# 查看某个 Profile 的 Skills
gant list --profile frontend
```

## 7. 日常更新流程

当知识库有更新时：

```bash
gant sync
gant use <your-profile>
```

## 8. 故障排查

### SSH 认证失败

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your-email@company.com"

# 复制公钥到 Codeup
cat ~/.ssh/id_ed25519.pub
```

将公钥添加到 Codeup 的「个人设置 → SSH 公钥」中。

### 仓库不存在

检查 `gant.yaml` 中的仓库地址是否正确，以及是否有访问权限。

### Agent 没有加载 Skills

1. 确认 `gant doctor` 环境检查通过
2. 确认已运行 `gant use <profile>`
3. 检查 Agent 的 skill 目录是否有符号链接：

```bash
ls -la ~/.opencode/skills/
ls -la ~/.claude/skills/
```

## 9. 多 Agent 支持

Gant-Agent 默认同步到以下 Agent：

- **OMC (Opencode)**: `~/.opencode/skills/`
- **Claude**: `~/.claude/skills/`
- **Cursor**: `~/.cursor/skills/`

如需添加其他 Agent，编辑 `gant.yaml`：

```yaml
settings:
  agentPaths:
    opencode: ~/.opencode/skills
    claude: ~/.claude/skills
    cursor: ~/.cursor/skills
    your-agent: ~/.your-agent/skills
```
