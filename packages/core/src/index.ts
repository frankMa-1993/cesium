/**
 * @cesium-eco/core
 * Cesium 核心封装
 */

export { createViewer, TIANDITU_TOKEN } from './viewer'
export { addTiandituLayers, createGaodeSatelliteWmtsProvider } from './layers'
export { loadBillboardPoints, type PointGeoJSON, type PointLayerResult } from './points'
export { flyTo, flyToChina } from './camera'
export {
  addWaterSurface,
  removeWaterSurface,
  SHENZHEN_CENTER_LON,
  SHENZHEN_CENTER_LAT,
  DEFAULT_WATER_POLYGON_DEGREES,
  type WaterSurfaceOptions,
} from './water'
export { cesiumPlugin } from './plugin'
