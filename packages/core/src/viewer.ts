import * as Cesium from 'cesium'

const TIANDITU_TOKEN = (globalThis as any).__TIANDITU_TOKEN__ || 'your_tianditu_token_here'

export { TIANDITU_TOKEN }

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
