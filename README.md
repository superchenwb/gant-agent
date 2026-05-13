# Gant-Agent

> 团队级 AI 业务知识库管理工具

Gant-Agent 帮助团队将业务知识库（Wiki）一键部署到 AI Agent 中，让团队成员的 AI 助手自动拥有项目专属的业务知识。

## 快速开始

### 方式一：AI 辅助安装（推荐）

将 [`docs/guide/installation.md`](docs/guide/installation.md) 的内容复制粘贴到你的 AI 助手（如 Claude、Cursor）会话中，AI 会自动帮你完成全部安装配置。

### 方式二：手动安装

```bash
# 1. 安装 Gant-Agent
# TODO: 等待正式发布

# 2. 初始化项目
gant init

# 3. 选择业务知识库
# - 雅迪 BOM 系统
# - 其他自定义 Wiki
```

## 它能做什么

| 场景 | 效果 |
|------|------|
| **新员工入职** | 问 AI "EBOM 和 MBOM 有什么区别？"，AI 直接引用公司内部知识库回答 |
| **需求评审** | 问 AI "变更流程有哪些审批节点？"，AI 给出准确的业务规则 |
| **排查问题** | 问 AI "为什么 MBOM 没有同步？"，AI 指出断点管理或制造接收环节 |

## 工作原理

```
业务知识库 (Wiki)
    ├── wiki/          # 业务概念文档
    ├── skills/        # AI 可执行的业务 Skill
    └── CLAUDE.md      # AI 行为准则

Gant-Agent
    ├── 下载 Wiki 仓库
    ├── 挂载 skills/ 到 OMC
    └── 注册到 AI 助手配置

团队成员的 AI 助手
    └── 自动加载业务 Skill，回答业务问题
```

## 支持的官方知识库

| 知识库 | 领域 | 状态 |
|--------|------|------|
| [雅迪 BOM 系统](git@codeup.aliyun.com:gant/wiki/yadea-wiki.git) | 制造业 BOM 管理 | ✅ 可用 |
| 雅迪 CRM 系统 | 客户关系管理 | 🚧 开发中 |

## 项目状态

🚧 **早期开发阶段**

- [x] 知识库结构定义
- [x] Skill 编译器（模块化编译）
- [x] 安装指南（AI Prompt）
- [ ] CLI 工具 (`gant init`)
- [ ] 自动更新机制
- [ ] 多项目支持

## 相关项目

- [yadea-wiki](git@codeup.aliyun.com:gant/wiki/yadea-wiki.git) — 雅迪 BOM 业务知识库示例

## License

MIT