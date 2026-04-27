import * as Cesium from 'cesium'

/** 深圳市中心 WGS84 */
export const SHENZHEN_CENTER_LON = 114.0579
export const SHENZHEN_CENTER_LAT = 22.5431

/** 默认水域多边形 */
export const DEFAULT_WATER_POLYGON_DEGREES = [
  114.03331809082031, 22.58265078125,
  114.01889853515625, 22.55037844238281,
  114.02782492675781, 22.50917971191406,
  114.10472922363281, 22.501626611328125,
  114.10472922363281, 22.571664453125,
  114.03331809082031, 22.58265078125,
]

export interface WaterSurfaceOptions {
  positionsDegrees?: number[]
  frequency?: number
  animationSpeed?: number
  amplitude?: number
}

/**
 * 向场景添加水面 Primitive（内置 Water 材质）
 */
export function addWaterSurface(
  viewer: Cesium.Viewer,
  options: WaterSurfaceOptions = {}
): Cesium.Primitive {
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
 * 从场景移除水面 Primitive
 */
export function removeWaterSurface(
  viewer: Cesium.Viewer,
  primitive: Cesium.Primitive | null
): void {
  if (!viewer || !primitive || (primitive as any).isDestroyed?.()) return
  viewer.scene.primitives.remove(primitive)
}
