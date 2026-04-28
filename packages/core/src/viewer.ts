/// <reference types="vite/client" />
import * as Cesium from 'cesium'

declare const __TIANDITU_TOKEN__: string | undefined

const TIANDITU_TOKEN_PLACEHOLDER = 'your_tianditu_token_here'

function resolveTiandituToken(): string {
  const fromEnv = (import.meta.env.VITE_TIANDITU_TOKEN as string | undefined)?.trim() || ''
  const fromDefine =
    typeof __TIANDITU_TOKEN__ !== 'undefined' ? String(__TIANDITU_TOKEN__).trim() : ''
  const raw = fromEnv || fromDefine
  if (!raw || raw === TIANDITU_TOKEN_PLACEHOLDER) return ''
  return raw
}

// 须在任意 Ion 请求（如 Cesium World Terrain）之前设置；内置 demo token 已不可用。
// 优先使用环境变量，便于各入口与 CI 统一。
const CESIUM_ION_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MTAwZGU0Zi04MzQzLTRhZTItYWY0ZS1mODU3Mzg2NjhiMWIiLCJpZCI6MTk3ODkzLCJpYXQiOjE3NzczNzAwNjV9.ZfVooVU2KF-yIEmVYsbhYugDiYCqiv44xnn4pj2ibhI'
Cesium.Ion.defaultAccessToken =
  (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined) || CESIUM_ION_FALLBACK

/** 有效天地图 key；无效或占位时为空字符串，由底图逻辑走 Ion/OSM 回退 */
export const TIANDITU_TOKEN = resolveTiandituToken()

/**
 * 创建 Viewer
 */
export function createViewer(
  container: string | HTMLElement,
  options: Cesium.Viewer.ConstructorOptions = {}
): Cesium.Viewer {
  const viewer = new Cesium.Viewer(container, {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    vrButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    shouldAnimate: true,
    skyBox: false,
    ...options,
  })

  ;(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'
  viewer.scene.globe.depthTestAgainstTerrain = false
  viewer.scene.globe.enableLighting = false
  viewer.scene.fog.enabled = false
  viewer.scene.skyAtmosphere.show = true
  viewer.scene.postProcessStages.fxaa.enabled = true

  return viewer
}
