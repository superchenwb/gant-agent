# 发布指南

## 首次发布

### 1. 注册 npm 账号

如果你还没有 npm 账号：

```bash
npm adduser
```

按提示输入用户名、密码和邮箱。

### 2. 登录

```bash
npm login
```

验证登录状态：

```bash
npm whoami
```

### 3. 获取 Access Token（用于 CI 自动发布）

1. 访问 https://www.npmjs.com/settings/tokens
2. 点击 "Generate New Token" → "Classic Token"
3. 选择 "Automation" 类型
4. 复制生成的 token

### 4. 配置 GitHub Secrets

在 GitHub 仓库设置中添加 Secret：

- 名称：`NPM_TOKEN`
- 值：上一步复制的 token

### 5. 发布

```bash
# 确保代码已提交
git add .
git commit -m "release: v0.1.0"

# 打 tag（触发 CI 自动发布）
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions 会自动运行测试并发布到 npm。

---

## 后续版本更新

### 手动发布（本地）

```bash
# 1. 更新版本号
npm version patch  # patch | minor | major

# 2. 构建
npm run build

# 3. 发布
npm publish --access public

# 4. 推送 tag
git push --follow-tags
```

### 自动发布（推荐）

```bash
# 1. 更新 CHANGELOG.md
# 2. 更新版本号
npm version patch

# 3. 推送 tag，触发 CI
git push --follow-tags
```

---

## 版本号规则

遵循 [SemVer](https://semver.org/lang/zh-CN/)：

- **patch** (0.1.0 → 0.1.1)：bug 修复、小改动
- **minor** (0.1.0 → 0.2.0)：新功能、向下兼容
- **major** (0.1.0 → 1.0.0)：破坏性变更

---

## 发布前检查清单

- [ ] `npm run build` 通过
- [ ] `npm test` 通过
- [ ] `npm run lint` 通过
- [ ] `CHANGELOG.md` 已更新
- [ ] `package.json` 版本号已更新
- [ ] README.md 中的版本号已更新（如有）
