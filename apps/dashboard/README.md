# dashboard

生产级应用入口 —— 全域生态环境监测大屏。

基于 Vue 3 + Vite + Cesium，整合 `@cesium-eco/*` workspace 包构建的完整大屏应用。

## 安装

```bash
pnpm install
```

## 开发

```bash
# 启动开发服务器（端口 3000）
pnpm dev

# 构建生产包
pnpm build

# 预览生产构建
pnpm preview
```

## 测试

```bash
# 单元测试
pnpm test:unit

# E2E 测试
pnpm test:e2e

# E2E 可视化调试
pnpm test:e2e:open
```

## 目录

```
src/
  main.ts          # 应用入口：挂载 Vue + Pinia + Router + Cesium 插件
  App.vue          # 根组件（仅 router-view）
  styles/          # 全局 SCSS
  mock/            # Vite Mock 插件
public/            # 静态资源（favicon、icons、geojson）
```

## 依赖

- `dependencies`: `vue`, `vue-router`, `pinia`, `pinia-plugin-persistedstate`, `@cesium-eco/*`
- `devDependencies`: `vite`, `vite-plugin-cesium`, `typescript`, `vue-tsc`, `sass`, `cypress`, `vitest`, `@vitest/coverage-v8`
