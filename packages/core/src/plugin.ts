import type { App } from 'vue'
import {
  createViewer,
  addTiandituLayers,
  createGaodeSatelliteWmtsProvider,
  loadBillboardPoints,
  flyTo,
  flyToChina,
} from './index'
import { addWaterSurface, removeWaterSurface } from './water'

/**
 * 全局 Vue 插件，暴露 $cesium 方法
 */
export const cesiumPlugin = {
  install(app: App) {
    app.config.globalProperties.$cesium = {
      createViewer,
      addTiandituLayers,
      createGaodeSatelliteWmtsProvider,
      loadBillboardPoints,
      flyTo,
      flyToChina,
      addWaterSurface,
      removeWaterSurface,
    }
  },
}

// 类型扩展
declare module 'vue' {
  interface ComponentCustomProperties {
    $cesium: {
      createViewer: typeof createViewer
      addTiandituLayers: typeof addTiandituLayers
      createGaodeSatelliteWmtsProvider: typeof createGaodeSatelliteWmtsProvider
      loadBillboardPoints: typeof loadBillboardPoints
      flyTo: typeof flyTo
      flyToChina: typeof flyToChina
      addWaterSurface: typeof addWaterSurface
      removeWaterSurface: typeof removeWaterSurface
    }
  }
}
