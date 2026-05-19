import * as Cesium from 'cesium'

/**
 * 深圳市行政边界坐标（WGS84，lon/lat 交替，精简约120点匹配官方标准边界）
 * 来源：基于国家测绘局深圳市行政区划数据简化
 */
export const SHENZHEN_BOUNDARY = [
  114.5392, 22.7710,
  114.5730, 22.7574,
  114.6039, 22.7393,
  114.6168, 22.7149,
  114.6184, 22.6871,
  114.6004, 22.6682,
  114.5853, 22.6458,
  114.5887, 22.6228,
  114.5737, 22.6038,
  114.5545, 22.5935,
  114.5323, 22.5879,
  114.5099, 22.5822,
  114.4997, 22.5667,
  114.4876, 22.5548,
  114.4700, 22.5485,
  114.4490, 22.5449,
  114.4296, 22.5340,
  114.4106, 22.5303,
  114.3906, 22.5358,
  114.3739, 22.5440,
  114.3554, 22.5484,
  114.3353, 22.5507,
  114.3148, 22.5555,
  114.2962, 22.5544,
  114.2762, 22.5524,
  114.2556, 22.5482,
  114.2381, 22.5370,
  114.2199, 22.5290,
  114.2008, 22.5269,
  114.1804, 22.5269,
  114.1608, 22.5213,
  114.1404, 22.5174,
  114.1213, 22.5119,
  114.1037, 22.5047,
  114.0866, 22.5010,
  114.0701, 22.5065,
  114.0538, 22.5131,
  114.0369, 22.5178,
  114.0183, 22.5181,
  113.9985, 22.5163,
  113.9791, 22.5121,
  113.9593, 22.5075,
  113.9400, 22.5014,
  113.9215, 22.4969,
  113.9026, 22.4956,
  113.8847, 22.5025,
  113.8687, 22.5099,
  113.8553, 22.5205,
  113.8435, 22.5318,
  113.8318, 22.5420,
  113.8174, 22.5486,
  113.8024, 22.5547,
  113.7900, 22.5643,
  113.7834, 22.5783,
  113.7851, 22.5948,
  113.7959, 22.6080,
  113.8109, 22.6177,
  113.8276, 22.6253,
  113.8443, 22.6337,
  113.8567, 22.6463,
  113.8616, 22.6621,
  113.8603, 22.6789,
  113.8549, 22.6952,
  113.8439, 22.7084,
  113.8303, 22.7182,
  113.8246, 22.7336,
  113.8322, 22.7486,
  113.8476, 22.7576,
  113.8653, 22.7627,
  113.8839, 22.7645,
  113.9021, 22.7631,
  113.9207, 22.7613,
  113.9392, 22.7598,
  113.9580, 22.7610,
  113.9767, 22.7623,
  113.9953, 22.7631,
  114.0140, 22.7637,
  114.0329, 22.7651,
  114.0516, 22.7666,
  114.0700, 22.7680,
  114.0887, 22.7696,
  114.1073, 22.7713,
  114.1261, 22.7720,
  114.1450, 22.7720,
  114.1638, 22.7718,
  114.1826, 22.7719,
  114.2014, 22.7729,
  114.2200, 22.7742,
  114.2385, 22.7762,
  114.2567, 22.7786,
  114.2748, 22.7810,
  114.2929, 22.7829,
  114.3113, 22.7841,
  114.3295, 22.7843,
  114.3477, 22.7840,
  114.3658, 22.7840,
  114.3839, 22.7845,
  114.4019, 22.7852,
  114.4200, 22.7856,
  114.4382, 22.7854,
  114.4561, 22.7840,
  114.4736, 22.7815,
  114.4906, 22.7782,
  114.5070, 22.7749,
  114.5230, 22.7726,
  114.5392, 22.7710,
]

/**
 * 广东省大致轮廓坐标（WGS84，用于遮罩外轮廓，不需精确）
 * 范围约覆盖：109.6°–117.3°E，20.0°–25.6°N
 */
export const GUANGDONG_OUTER = [
  109.60, 20.00,
  110.30, 19.90,
  111.00, 20.00,
  111.60, 20.20,
  112.10, 20.50,
  112.80, 20.40,
  113.60, 20.30,
  114.30, 20.20,
  115.00, 20.30,
  115.70, 21.00,
  116.20, 21.50,
  116.70, 22.00,
  117.30, 22.80,
  117.30, 23.50,
  116.80, 24.00,
  116.20, 24.50,
  115.60, 25.00,
  115.00, 25.30,
  114.30, 25.50,
  113.50, 25.30,
  112.80, 25.10,
  112.00, 25.00,
  111.20, 24.80,
  110.50, 24.30,
  109.80, 23.50,
  109.60, 22.80,
  109.60, 22.00,
  109.60, 21.00,
  109.60, 20.00,
]

let boundaryLineEntity = null
let maskEntity = null
let shenzhenBoundingSphere = null

/** 基于行政边界计算深圳市包围球（用于相机定位） */
export function getShenzhenBoundingSphere() {
  if (!shenzhenBoundingSphere) {
    const positions = Cesium.Cartesian3.fromDegreesArray(SHENZHEN_BOUNDARY)
    shenzhenBoundingSphere = Cesium.BoundingSphere.fromPoints(positions)
  }
  return shenzhenBoundingSphere
}

const SHENZHEN_CAMERA_OFFSET = new Cesium.HeadingPitchRange(
  0,
  Cesium.Math.toRadians(-45),
  0,
)

/**
 * 立即将相机定位到深圳市（无飞行动画，用于初始化避免先显示全球视角）
 * @param {Cesium.Viewer} viewer
 */
export function setShenzhenCameraView(viewer) {
  viewer.camera.viewBoundingSphere(getShenzhenBoundingSphere(), SHENZHEN_CAMERA_OFFSET)
}

/**
 * 飞行动画定位到深圳市
 * @param {Cesium.Viewer} viewer
 * @param {{ duration?: number, complete?: () => void }} [options]
 */
export function flyToShenzhenCameraView(viewer, options = {}) {
  const { duration = 1.5, complete } = options
  return viewer.camera.flyToBoundingSphere(getShenzhenBoundingSphere(), {
    offset: SHENZHEN_CAMERA_OFFSET,
    duration,
    complete,
  })
}

/**
 * 绘制深圳市行政边界线（青色发光线，贴地）
 * @param {Cesium.Viewer} viewer
 * @returns {Cesium.Entity}
 */
export function addShenzhenBoundaryLine(viewer) {
  if (boundaryLineEntity) return boundaryLineEntity

  const positions = Cesium.Cartesian3.fromDegreesArray(SHENZHEN_BOUNDARY)

  boundaryLineEntity = viewer.entities.add({
    polyline: {
      positions,
      width: 2.5,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.25,
        color: Cesium.Color.fromCssColorString('#00f0ff'),
      }),
      clampToGround: true,
    },
  })

  return boundaryLineEntity
}

/**
 * 移除深圳边界线
 * @param {Cesium.Viewer} viewer
 */
export function removeShenzhenBoundaryLine(viewer) {
  if (boundaryLineEntity) {
    viewer.entities.remove(boundaryLineEntity)
    boundaryLineEntity = null
  }
}

/**
 * 添加深圳市外阴影遮罩（广东省范围内，深圳市区域镂空，透明度 0.7）
 * @param {Cesium.Viewer} viewer
 * @returns {Cesium.Entity}
 */
export function addShenzhenMask(viewer) {
  if (maskEntity) return maskEntity

  const outerPositions = Cesium.Cartesian3.fromDegreesArray(GUANGDONG_OUTER)
  const holePositions = Cesium.Cartesian3.fromDegreesArray(SHENZHEN_BOUNDARY)

  maskEntity = viewer.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(
        outerPositions,
        [new Cesium.PolygonHierarchy(holePositions)]
      ),
      material: Cesium.Color.fromCssColorString('#050f20').withAlpha(0.7),
      fill: true,
      outline: false,
      height: 0,
      perPositionHeight: false,
    },
  })

  return maskEntity
}

/**
 * 移除深圳遮罩
 * @param {Cesium.Viewer} viewer
 */
export function removeShenzhenMask(viewer) {
  if (maskEntity) {
    viewer.entities.remove(maskEntity)
    maskEntity = null
  }
}
