# @cesium-eco/app

大屏示例应用包，整合视图、路由与状态管理，作为可复用的 Dashboard 模块。

## 安装

```bash
pnpm add @cesium-eco/app --workspace
```

## 使用

```ts
import { createApp } from 'vue'
import { Dashboard, router, pinia } from '@cesium-eco/app'
import { cesiumPlugin } from '@cesium-eco/core'

const app = createApp(Dashboard)
app.use(pinia)
app.use(router)
app.use(cesiumPlugin)
app.mount('#app')
```

## 导出

| 名称 | 说明 |
|------|------|
| `Dashboard` | 主屏页面组件（含左/右数据面板 + 中央地图） |
| `router` | Vue Router 实例（Hash 模式，单一路由 `/`） |
| `pinia` | Pinia 实例（含 `pinia-plugin-persistedstate`） |

## 依赖

- `peerDependencies`: `vue ^3.5.0`, `vue-router ^5.0.0`
- `dependencies`: `@cesium-eco/api`, `@cesium-eco/core`, `@cesium-eco/shared`, `@cesium-eco/ui`
- `devDependencies`: `typescript`, `vite`, `vue-tsc`, `sass`, `pinia`, `pinia-plugin-persistedstate`, `@vitejs/plugin-vue`, `@cesium-eco/config`
