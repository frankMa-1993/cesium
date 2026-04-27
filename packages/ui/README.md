# @cesium-eco/ui

Vue 3 组件库，提供地图容器、统计卡片与趋势图表等大屏专用组件。

## 安装

```bash
pnpm add @cesium-eco/ui --workspace
```

## 使用

```vue
<script setup>
import { MapViewer, StatCard, TrendChart } from '@cesium-eco/ui'
</script>

<template>
  <MapViewer />
  <StatCard label="设备在线数" :value="128" unit="台" color="#00f0ff" />
  <TrendChart :data="[10, 20, 15]" :labels="['08:00', '12:00', '16:00']" />
</template>
```

## 组件

| 组件 | 说明 | 主要 Props |
|------|------|-----------|
| `MapViewer` | Cesium 地图容器（含图层切换、视角重置、点位弹窗） | — |
| `StatCard` | 数据统计卡片，支持数字动画与趋势指示 | `label`, `value`, `unit?`, `color?`, `trend?` |
| `TrendChart` | SVG 趋势折线图 | `data`, `labels`, `width?`, `height?`, `color?` |

## 依赖

- `peerDependencies`: `vue ^3.5.0`, `cesium ^1.100.0`
- `dependencies`: `@cesium-eco/api`, `@cesium-eco/core`, `@cesium-eco/shared`
- `devDependencies`: `typescript`, `vite`, `vue-tsc`, `sass`, `@vitejs/plugin-vue`, `@cesium-eco/config`
