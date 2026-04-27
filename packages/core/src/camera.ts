import * as Cesium from 'cesium'

/**
 * 相机飞行到指定位置
 */
export function flyTo(
  viewer: Cesium.Viewer,
  lon: number,
  lat: number,
  height = 100000,
  duration = 1.5
): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration,
  })
}

/**
 * 相机定位到中国上空
 */
export function flyToChina(viewer: Cesium.Viewer): void {
  flyTo(viewer, 105, 35, 5000000, 2)
}
