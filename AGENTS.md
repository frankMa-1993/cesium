# 工程说明（Agent 同步）

## 功能简述

基于 Vue 3 + Vite + Cesium 的全域生态环境监测大屏：天地图底图、监测点 Billboard、接口 Mock，以及按《水域.md》在主屏地图中集成的 **Cesium 水面 Primitive**（PolygonGeometry + 内置 Water 材质）。已移除原「水面3D演示」独立路由及其 GroundPrimitive / 自定义材质与图层侧栏相关代码。

## 关键目录结构

```
src/
  utils/
    cesium-init.js   # Viewer、天地图、点位、相机、$cesium 插件
    cesium-water.js  # 水面 addWaterSurface / removeWaterSurface
  components/
    MapViewer.vue    # 地图容器：初始化水域、相机、点位与销毁清理
  views/
    Dashboard.vue    # 大屏主页面
```

## 规范提示

- 包管理：优先使用 **pnpm**（见仓库内 AHENTS.md）。
- 水域参数与原理见根目录 **水域.md**。
