# @cesium-eco/shared

共享资源包，提供全域监测大屏的类型定义、SCSS 变量与通用样式入口。

## 安装

```bash
pnpm add @cesium-eco/shared --workspace
```

## 使用

**类型导入**

```ts
import type { LayerItem, LayerState } from '@cesium-eco/shared'
```

**SCSS 变量引用**

```scss
@use "@cesium-eco/shared/styles/vars.scss" as *;

.my-panel {
  background: $bg-panel;
  border: 1px solid $border-color;
}
```

## 导出

| 名称 | 说明 |
|------|------|
| `LayerType` | 图层类型：`'geojson' \| '3dtiles' \| 'imagery'` |
| `LayerItem` | 图层项接口（id、type、visible、alpha 等） |
| `LayerState` | 图层状态接口（layers、pickEnabled、selectedFeature） |
| `styles/vars.scss` | SCSS 变量：色彩系统、布局尺寸、文字色阶 |

## 依赖

- `devDependencies`: `typescript`, `vite`
- `workspace`: `@cesium-eco/config`
