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
Gant-Agent 是 Gant 公司的业务技能包安装器，它会将指定的业务知识库（Wiki）和技术技能包挂载到 Oh-My-OpenAgent 中，让 Agent 拥有项目专属的业务知识和技术规范。

## 第一步：环境检查

确保 Node.js 和 Git 已安装：

```bash
node --version  # 需要 >= 18
git --version
```

确保 OpenCode 和 Oh-My-OpenAgent 已安装：

```bash
if command -v opencode &> /dev/null; then
    echo "OpenCode 已安装"
else
    echo "错误：OpenCode 未安装，请先安装 OpenCode"
    exit 1
fi

if [ -f ~/.config/opencode/oh-my-openagent.json ]; then
    echo "Oh-My-OpenAgent 已安装"
else
    echo "Oh-My-OpenAgent 未安装，正在自动安装..."
    bunx oh-my-openagent install --no-tui --claude=yes
fi
```

## 第二步：安装 Gant-Agent

```bash
npm install -g gant-agent
```

## 第三步：初始化配置

```bash
gant init
```

这会创建 `~/.gant-agent/gant.yaml` 配置文件。

## 第四步：询问用户需要哪些知识库

你必须向用户询问以下问题，等待回答后再继续：

当前项目需要用到哪些知识库？

### 业务知识
1. 雅迪 BOM 系统 → git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
2. skip

### 技术规范
需要加载公司通用的技术技能包吗？
1. 是 → 安装 gant-skills git@codeup.aliyun.com:gant/Project-AI/gant-skills.git
2. 否 → 跳过

gant-skills 包含以下分类，请选择你需要的（可多选，用逗号分隔）：
1. 前端 (frontend)
2. 后端 (backend)
3. 数据库 (database)
4. 测试 (testing)
5. 文档 (docs)
输入示例：1,4

## 第五步：同步知识库

```bash
gant sync
```

这会：
1. 克隆所有配置的 Git 仓库
2. 检测仓库中的 Skill
3. 创建符号链接
4. 生成锁定文件

## 第六步：选择 Profile 并激活

```bash
# 查看可用 Profiles
gant status

# 根据用户角色选择 Profile
gant use default    # 全员默认
gant use frontend   # 前端开发
gant use backend    # 后端开发
gant use fullstack  # 全栈开发
```

## 第七步：验证

安装完成。现在你在 OpenCode 中提问时，Oh-My-OpenAgent 会自动加载对应的业务知识。

测试一下：问我一个关于当前项目的问题，我会基于已加载的知识回答。

## 自动更新

当知识库有更新时：

```bash
gant sync
```

当需要切换不同技术栈时：

```bash
gant use <profile>
```

## 故障排除

如果 gant sync 失败：

1. 检查 Git 权限：`ssh -T git@codeup.aliyun.com`
2. 检查配置：`gant doctor`
3. 查看状态：`gant status`
4. 重新初始化：`gant init --force`

## 配置文件位置

- 主配置：`~/.gant-agent/gant.yaml`
- 锁定文件：`~/.gant-agent/gant.lock`
- 缓存目录：`~/.gant-agent/cache/`
- Profile 目录：`~/.gant-agent/profiles/`
