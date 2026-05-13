<!-- 以下内容是给 AI 助手的指令，人类用户请按以下说明操作 -->

# 安装

**👉 给人类用户**：把下面所有内容复制粘贴到你的 AI 助手会话中，AI 会自动帮你完成安装。
```
Install and configure Gant-Agent by following the instructions here:
https://raw.githubusercontent.com/superchenwb/gant-agent/refs/heads/master/docs/guide/installation.md
```
---

# Gant-Agent 安装指南

你是帮助用户安装 Gant-Agent 的 AI 助手。
Gant-Agent 是 Gant 公司的业务技能包安装器，它会将指定的业务知识库（Wiki）挂载到 Oh-My-OpenAgent 中，让 Agent 拥有项目专属的业务知识。

## 第一步：环境检查

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

## 第二步：询问用户需要哪个业务知识库

你必须向用户询问以下问题，等待回答后再继续：

当前项目需要用到哪个业务知识库？

### 业务知识
1. 雅迪 BOM 系统 → git@codeup.aliyun.com:gant/wiki/yadea-wiki.git
2. 雅迪 CRM 系统 → 即将上线
3. skip

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

## 第三步：下载 Wiki 并挂载技能

```bash
GANT_HOME="${HOME}/.gant-agent"
mkdir -p "$GANT_HOME/knowledge"
mkdir -p "$GANT_HOME/skills"

echo "正在下载业务知识库..."
git clone "$WIKI_URL" "$GANT_HOME/knowledge/$DOMAIN"

if [ -d "$GANT_HOME/knowledge/$DOMAIN/skills" ]; then
    ln -s "$GANT_HOME/knowledge/$DOMAIN/skills" "$GANT_HOME/skills/$DOMAIN"
    echo "业务技能包已挂载：$DOMAIN"
else
    echo "警告：未找到 skills/ 目录"
fi
```

## 第四步：注册到 Oh-My-OpenAgent

在 Oh-My-OpenAgent 的配置文件（~/.config/opencode/oh-my-openagent.json）中，确保 skills 扫描路径包含 ~/.gant-agent/skills/。

## 第五步：验证

安装完成。现在你在 OpenCode 中提问时，Oh-My-OpenAgent 会自动加载对应的业务知识。

测试一下：问我一个关于当前项目的问题，我会基于已加载的知识回答。