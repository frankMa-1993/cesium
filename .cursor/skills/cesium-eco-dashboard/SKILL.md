---
name: cesium-eco-dashboard
description: 说明本仓库 Vue 3 + Vite + Cesium 生态环境监测大屏的架构与约定：天地图底图、监测点 Billboard、Mock、水面 Primitive（PolygonGeometry + Water 材质，见 cesium-water.js / MapViewer.vue），以及水域参数文档《水域.md》；包管理使用 pnpm。当在本项目中修改地图、Cesium Viewer、水面、点位或大屏页面时应用此 skill。
---

# Cesium 生态环境监测大屏（本仓库）

## 技术栈与目标

- Vue 3、Vite、Cesium；主地图容器在 `src/components/MapViewer.vue`，大屏主页面在 `src/views/Dashboard.vue`。
- 功能范围：天地图底图、监测点 Billboard、接口 Mock、按《水域.md》集成的主屏 **Cesium 水面 Primitive**（PolygonGeometry + 内置 Water 材质）。

## 必读

- 改地图、水面、相机、点位前，先对照仓库根目录 **AGENTS.md** 与 **水域.md**（水面参数与原理）。
- 包管理优先使用 **pnpm**（约定见 **AHENTS.md**）。

## 关键文件

| 路径 | 职责 |
|------|------|
| `src/utils/cesium-init.js` | Viewer、天地图、点位、相机、`$cesium` 插件 |
| `src/utils/cesium-water.js` | 水面 `addWaterSurface` / `removeWaterSurface` |
| `src/components/MapViewer.vue` | 地图容器：初始化水域、相机、点位与销毁清理 |

## 约定

- 已移除原「水面 3D 演示」独立路由及其 GroundPrimitive、自定义材质与图层侧栏相关代码；不要恢复该套旧实现，除非产品明确要求并同步更新文档。
- 新增或修改水面相关逻辑时，以 `cesium-water.js` 与《水域.md》为准，避免重复造水面初始化与清理流程。
