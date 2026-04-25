import * as Cesium from 'cesium'

/** 深圳市中心 WGS84：水面 PolygonGeometry、内置 Water 材质采样与默认相机目标一致 */
export const SHENZHEN_CENTER_LON = 114.0579
export const SHENZHEN_CENTER_LAT = 22.5431

/**
 * 围绕市中心的水域多边形（lon/lat 交替，闭合环；与《水域》示例同形状与尺度，整体平移至深圳）
 */
export const DEFAULT_WATER_POLYGON_DEGREES = [
  114.03331809082031, 22.58265078125,
  114.01889853515625, 22.55037844238281,
  114.02782492675781, 22.50917971191406,
  114.10472922363281, 22.501626611328125,
  114.10472922363281, 22.571664453125,
  114.03331809082031, 22.58265078125,
]

/**
 * 向场景添加水面 Primitive（内置 Water 材质）
 * @param {Cesium.Viewer} viewer
 * @param {object} [options]
 * @param {number[]} [options.positionsDegrees] 经纬度扁平数组，默认使用文档示例区域
 * @param {number} [options.frequency] 波纹频率，默认 1000
 * @param {number} [options.animationSpeed] 流动速度，默认 0.01
 * @param {number} [options.amplitude] 振幅，默认 10
 * @returns {Cesium.Primitive}
 */
export function addWaterSurface(viewer, options = {}) {
  const positions = options.positionsDegrees ?? DEFAULT_WATER_POLYGON_DEGREES
  const frequency = options.frequency ?? 1000.0
  const animationSpeed = options.animationSpeed ?? 0.01
  const amplitude = options.amplitude ?? 10

  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(positions)
        ),
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
      }),
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      aboveGround: true,
      material: new Cesium.Material({
        fabric: {
          type: 'Water',
          uniforms: {
            normalMap: Cesium.buildModuleUrl('Assets/Textures/waterNormals.jpg'),
            frequency,
            animationSpeed,
            amplitude,
          },
        },
      }),
    }),
    show: true,
  })

  viewer.scene.primitives.add(primitive)
  return primitive
}

/**
 * 从场景移除水面 Primitive（组件卸载时调用，避免泄漏）
 * @param {Cesium.Viewer} viewer
 * @param {Cesium.Primitive | null} primitive
 */
export function removeWaterSurface(viewer, primitive) {
  if (!viewer || !primitive || primitive.isDestroyed?.()) return
  viewer.scene.primitives.remove(primitive)
}
