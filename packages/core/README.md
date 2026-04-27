# @cesium-eco/core

Cesium 核心封装库，提供 Viewer 创建、天地图底图、点位 Billboard、水面 Primitive 与相机控制等能力。

## 安装

```bash
pnpm add @cesium-eco/core --workspace
```

## 使用

```ts
import {
  createViewer,
  addTiandituLayers,
  addWaterSurface,
  flyToChina,
  loadBillboardPoints,
} from '@cesium-eco/core'

const viewer = createViewer(container)
addTiandituLayers(viewer)
addWaterSurface(viewer)
flyToChina(viewer)
```

## 导出

| 名称 | 说明 |
|------|------|
| `createViewer(container, options?)` | 创建精简版 Cesium.Viewer |
| `addTiandituLayers(viewer)` | 添加天地图影像+注记底图 |
| `createGaodeSatelliteWmtsProvider()` | 高德卫星 WMTS Provider |
| `loadBillboardPoints(viewer, geojson, onClick?)` | 加载 GeoJSON 点位为 Billboard |
| `flyTo(viewer, lon, lat, height?, duration?)` | 相机飞行到指定位置 |
| `flyToChina(viewer)` | 相机定位到中国上空 |
| `addWaterSurface(viewer, options?)` | 添加水面 Primitive（内置 Water 材质） |
| `removeWaterSurface(viewer, primitive?)` | 移除水面 Primitive |
| `cesiumPlugin` | Vue 全局插件，暴露 `$cesium` 方法 |
| `TIANDITU_TOKEN` | 天地图 Token |
| `SHENZHEN_CENTER_LON / LAT` | 深圳市中心坐标 |
| `DEFAULT_WATER_POLYGON_DEGREES` | 默认水域多边形 |

## 依赖

- `peerDependencies`: `cesium ^1.100.0`
- `devDependencies`: `typescript`, `vite`, `@cesium-eco/config`, `@cesium-eco/shared`
