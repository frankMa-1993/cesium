# CI/CD 配置指南

本文档描述 `cesium-eco` Monorepo 的持续集成与持续部署配置，包括 GitHub Actions 工作流、Turborepo 远程缓存以及部署策略。

---

## 目录

1. [GitHub Actions 工作流](#github-actions-工作流)
2. [Turborepo 远程缓存](#turborepo-远程缓存)
3. [部署策略](#部署策略)

---

## GitHub Actions 工作流

所有工作流文件存放在 `.github/workflows/` 目录下。

### 1. Pull Request 检查 — `pr-checks.yml`

每次打开或更新 Pull Request 时触发，执行代码规范检查、单元测试、类型检查和构建验证。

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/dashboard/coverage/lcov.info
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages & app
        run: pnpm build
```

### 2. Release 发布 — `release.yml`

基于 Changesets 的自动化发布流程：当合并带有 changeset 的 PR 到 `main` 分支时，自动创建/更新版本发布 PR；合并发布 PR 后自动打 Tag 并执行发布。

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

> **注意**：当前所有包均标记为 `private: true`，`changeset publish` 会跳过 npm 发布，仅创建 Git Tag 和 GitHub Release。若未来需要发布到 npm，请将对应包的 `private` 字段移除并配置正确的 `publishConfig`。

---

## Turborepo 远程缓存

Turborepo 的本地缓存可加速重复构建，但在 CI 环境（如 GitHub Actions）中每次运行都是全新的 Runner，本地缓存无法命中。**远程缓存**将构建产物上传到云端，使不同机器、不同工作流之间共享缓存。

### 方案一：Vercel Remote Cache（推荐）

Vercel 为开源项目和个人项目提供免费的 Remote Cache 额度。

#### 1. 配置环境变量

在 Vercel Dashboard 中创建 Team 或 Project，获取 Token 和 Team ID，然后在仓库的 **Settings > Secrets and variables > Actions** 中添加：

| Secret / Variable | 说明 |
|---|---|
| `TURBO_TOKEN` | Vercel 个人访问令牌（Scope 需包含 `read/write`） |
| `TURBO_TEAM` | Vercel Team 的 slug（个人用户可填用户名） |

#### 2. 在 CI 中启用

在上述 `pr-checks.yml` 和 `release.yml` 的 `build` job 中已配置：

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

Turborepo 会自动检测这些环境变量并启用远程缓存。

#### 3. 本地开发使用远程缓存

```bash
# 登录 Vercel（首次配置）
npx turbo login

# 关联 Team
npx turbo link

# 后续构建自动读写远程缓存
pnpm build
```

### 方案二：自托管 Remote Cache

若对数据安全性有更高要求，可使用自托管的 Turborepo Remote Cache Server：

```bash
# 使用社区实现的远程缓存服务（如 ducktors/turborepo-remote-cache）
docker run -p 3000:3000 \
  -e TURBO_TOKEN=your-secret-token \
  -e STORAGE_PROVIDER=local \
  -e STORAGE_PATH=/tmp/turbo-cache \
  ducktors/turborepo-remote-cache
```

然后在 `turbo.json` 中配置 API 地址（或通过 `TURBO_API` 环境变量）：

```bash
export TURBO_API=http://localhost:3000
export TURBO_TOKEN=your-secret-token
export TURBO_TEAM=cesium-eco
```

---

## 部署策略

### 前端静态资源部署

`apps/dashboard` 构建产物为纯静态文件（`dist/` 目录），适合部署到任何支持静态托管的平台。

#### 方案一：Vercel（推荐，与 Turborepo 生态一致）

1. 在 Vercel Dashboard 导入本仓库
2. 设置 Framework Preset 为 `Vite`
3. 配置 Build Command：
   ```bash
   cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter=dashboard
   ```
4. 配置 Output Directory：`apps/dashboard/dist`
5. 添加环境变量：`VITE_TIANDITU_TOKEN`

#### 方案二：Nginx / 自有服务器

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    root /var/www/cesium-eco/apps/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 方案三：GitHub Pages（演示环境）

```yaml
# .github/workflows/deploy-pages.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build --filter=dashboard
      - uses: actions/upload-pages-artifact@v3
        with:
          path: apps/dashboard/dist
      - uses: actions/deploy-pages@v4
```

### 部署环境划分

| 环境 | 分支 | 触发方式 | 用途 |
|---|---|---|---|
| 开发环境 | `develop` | 合并自动部署 | 功能验证、内部测试 |
| 预发布环境 | `release/*` | 手动触发 | UAT、回归测试 |
| 生产环境 | `main` | Release 合并后自动部署 | 正式对外服务 |

### 环境变量管理

不同环境通过 `.env` 文件或 CI/CD Secrets 注入：

| 变量 | 开发 | 预发布 | 生产 |
|---|---|---|---|
| `VITE_API_BASE` | `/api` (Mock) | `https://staging-api.example.com` | `https://api.example.com` |
| `VITE_TIANDITU_TOKEN` | 开发 Token | 预发布 Token | 生产 Token |
| `NODE_ENV` | `development` | `production` | `production` |

---

## 相关文档

- [VERSIONING.md](./VERSIONING.md) — 版本管理与 Changesets 工作流
- [Turborepo 官方文档](https://turbo.build/repo/docs)
- [Changesets 官方文档](https://github.com/changesets/changesets)
