# 本地开发指南

## 1. 环境要求

| 工具 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | `>= 20` | 使用 LTS 版本 |
| pnpm | `>= 10` | 由 `packageManager` 字段锁定，自动校验 |

> 若本地 pnpm 版本不符，执行 `corepack enable && corepack prepare pnpm@10.33.2 --activate` 激活正确版本。

## 2. 项目初始化

```bash
# 1. 克隆仓库
git clone <repo-url> cesium-eco
cd cesium-eco

# 2. 安装依赖（自动建立 workspace 链接）
pnpm install

# 3. 初始化 husky 钩子
pnpm exec husky install   # 仅首次
```

### 环境变量

项目依赖以下环境变量，开发时创建 `.env.local`（不会提交）：

```bash
# .env.local
VITE_API_BASE=/api
VITE_TIANDITU_TOKEN=your_tianditu_token
```

> 天地图 Token 请至 [天地图开放平台](https://console.tianditu.gov.cn/) 申请。

## 3. 常用命令

所有命令均在**根目录**执行，通过 Turborepo 编排子包任务。

### 开发

```bash
# 启动 dashboard 应用（默认）
pnpm dev

# 等价于
pnpm turbo run dev --filter=dashboard
```

### 构建

```bash
# 全量构建（按依赖拓扑顺序）
pnpm build

# 构建指定包
pnpm turbo run build --filter=@cesium-eco/ui
```

### 测试

```bash
# 运行所有测试（单元 + E2E）
pnpm test

# 仅单元测试
pnpm test:unit

# 仅 E2E 测试（需先 build）
pnpm test:e2e

# 带覆盖率报告
pnpm --filter=dashboard coverage
```

### 代码检查与格式化

```bash
# ESLint 检查全部包
pnpm lint

# ESLint 自动修复
pnpm lint:fix

# Prettier 格式化全部文件
pnpm format

# Prettier 检查（CI 使用）
pnpm format:check

# TypeScript 类型检查
pnpm typecheck
```

### 清理与调试

```bash
# 清理全部包的 dist 与缓存
pnpm clean

# 手动清除 Turborepo 本地缓存
rm -rf node_modules/.cache/turbo
```

## 4. 新增一个 Package

以新增 `@cesium-eco/map-tools` 为例：

### 4.1 创建目录与文件

```bash
mkdir -p packages/map-tools/src
cd packages/map-tools
```

### 4.2 编写 `package.json`

```json
{
  "name": "@cesium-eco/map-tools",
  "version": "0.1.0",
  "private": true,
  "description": "地图工具 — 测量、标注、截图",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "clean": "rm -rf dist node_modules/.cache",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cesium-eco/core": "workspace:*",
    "@cesium-eco/shared": "workspace:*"
  },
  "devDependencies": {
    "@cesium-eco/config": "workspace:*",
    "typescript": "^6.0.3",
    "vite": "^8.0.10"
  }
}
```

### 4.3 创建入口文件

```bash
touch src/index.ts
```

### 4.4 安装依赖

```bash
# 根目录执行，自动链接 workspace 依赖
pnpm install
```

### 4.5 在消费者包中引用

```json
// apps/dashboard/package.json 或其他包的 dependencies
{
  "dependencies": {
    "@cesium-eco/map-tools": "workspace:*"
  }
}
```

然后执行 `pnpm install` 完成链接。

## 5. 常见问题排查

### 5.1 `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`

**现象**：安装时报 workspace 包找不到。  
**原因**：`package.json` 中声明了 `workspace:*` 依赖，但对应包名或路径不匹配。  
**解决**：
- 检查 `pnpm-workspace.yaml` 是否包含该包所在目录。
- 检查被依赖包的 `name` 字段是否与引用方完全一致。

### 5.2 Cesium 加载报错或白屏

**现象**：运行 `pnpm dev` 后地图区域白屏，控制台报 `Cesium is undefined` 或资源 404。  
**原因**：Cesium 为大型库，Worker / WASM 资源路径需正确配置。  
**解决**：
- 确认 `vite-plugin-cesium` 已在 `apps/dashboard/vite.config.ts` 中配置。
- 确认 `public/cesium/` 目录存在且包含完整 Cesium 资源。
- 清除浏览器缓存后重试。

### 5.3 Turborepo 缓存导致构建产物未更新

**现象**：修改源码后执行 `pnpm build`，产物未变化。  
**解决**：
```bash
# 清除本地缓存
rm -rf node_modules/.cache/turbo

# 重新构建
pnpm build
```

### 5.4 类型报错 `Cannot find module '@cesium-eco/xxx'`

**现象**：TypeScript 无法识别 workspace 内部包。  
**原因**：对应包未构建，缺少 `.d.ts` 声明文件。  
**解决**：
```bash
# 先构建依赖包
pnpm turbo run build --filter=@cesium-eco/xxx

# 或在根目录全量构建
pnpm build
```

### 5.5 pnpm 版本不匹配

**现象**：执行 `pnpm install` 时提示 `This project is configured to use pnpm v10.33.2`。  
**解决**：
```bash
corepack enable
corepack prepare pnpm@10.33.2 --activate
```

### 5.6 提交代码时 Husky 报错

**现象**：`pre-commit` 钩子执行失败，提示 `lint-staged` 找不到。  
**解决**：
```bash
# 重新安装 husky
pnpm exec husky install

# 若仍失败，检查 node_modules 是否完整
pnpm install
```
