# Gant-Agent 快速上手

## 安装

```bash
npm install -g gant-agent
```

## 第一步：初始化配置

```bash
gant init
```

这会创建 `~/.gant-agent/gant.yaml`，包含默认的知识源配置。

## 第二步：同步知识库

```bash
gant sync
```

这会：
1. 克隆所有配置的 Git 仓库到 `~/.gant-agent/cache/`
2. 自动检测每个仓库中的 Skill
3. 为每个 Profile 创建符号链接
4. 生成 `gant.lock` 锁定文件

## 第三步：激活 Profile

```bash
# 查看可用 Profiles
gant status

# 切换到默认配置（全员业务知识）
gant use default

# 切换到前端配置（业务 + 前端规范）
gant use frontend

# 切换到全栈配置
gant use fullstack
```

## 第四步：验证

问 AI 助手一个业务问题：

> "EBOM 和 MBOM 有什么区别？"

AI 应该能引用公司内部知识库回答。

## 常用命令

| 命令 | 说明 |
|------|------|
| `gant init` | 初始化配置 |
| `gant sync` | 同步所有知识源 |
| `gant sync --dry-run` | 预览变更 |
| `gant use <profile>` | 切换 Profile |
| `gant status` | 查看当前状态 |
| `gant doctor` | 环境诊断 |

## 自定义配置

编辑 `~/.gant-agent/gant.yaml`：

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
```

修改后运行 `gant sync` 生效。

## 更新知识库

```bash
# 检查并更新所有知识源
gant sync

# 查看详细日志
gant sync --verbose
```

## 常见问题

### Q: 提示 "配置文件不存在"

运行 `gant init` 初始化。

### Q: 提示 "锁定文件不存在，请先运行 gant sync"

运行 `gant sync` 生成锁定文件。

### Q: Git 克隆失败

检查 SSH key 是否有权限访问 Codeup 仓库：

```bash
ssh -T git@codeup.aliyun.com
```

### Q: 如何添加本地开发目录

在 `gant.yaml` 中添加：

```yaml
sources:
  my-dev:
    localPath: ~/Code/my-skills
```

## 下一步

- 阅读 [配置规范](../design/config-spec.md) 了解完整配置选项
- 阅读 [安装指南](./installation.md) 了解 AI 辅助安装方式
