import * as Cesium from 'cesium'

const BUS_ICON_URL = '/car.png'
const BATCH_SIZE = 800
/** 拾取窗口（像素），便于 1 万密集点悬停/点击 */
const PICK_WINDOW = 14

function isBusStationBillboard(billboard) {
  return billboard?._meta?.layerType === 'busStation'
}

/**
 * 公交车站图层：BillboardCollection 批量渲染，适合 1 万级点位
 * @param {Cesium.Viewer} viewer
 * @param {object} geojson - FeatureCollection
 * @param {{ onProgress?: (loaded: number, total: number) => void }} [options]
 * @returns {Promise<{ collection: Cesium.BillboardCollection }>}
 */
export async function loadBusStations(viewer, geojson, options = {}) {
  // BillboardCollection 须在构造时传入 scene，否则 CLAMP_TO_GROUND 在 add 时会抛 DeveloperError
  const collection = new Cesium.BillboardCollection({ scene: viewer.scene })
  viewer.scene.primitives.add(collection)

  const features = geojson.features || []
  const total = features.length

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, total)
    for (let j = i; j < end; j++) {
      const feature = features[j]
      const [lon, lat] = feature.geometry.coordinates
      const props = feature.properties

      const billboard = collection.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        image: BUS_ICON_URL,
        width: 32,
        height: 32,
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(800, 1.2, 12000, 0.55),
      })

      billboard._meta = {
        ...props,
        layerType: 'busStation',
      }
      billboard._baseScale = 1.0
    }

    options.onProgress?.(end, total)
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }

  return { collection }
}

/**
 * 从 pick 结果解析公交车站 Billboard
 * Cesium 拾取 Billboard 时：primitive 为 Billboard 实例，collection 为 BillboardCollection
 * @param {object} picked
 * @param {Cesium.BillboardCollection} collection
 */
export function getBusBillboardFromPick(picked, collection) {
  if (!picked || !collection) return null

  if (picked.collection === collection && isBusStationBillboard(picked.primitive)) {
    return picked.primitive
  }

  // 兼容旧版：primitive 为 collection、id 为 billboard
  if (picked.primitive === collection && isBusStationBillboard(picked.id)) {
    return picked.id
  }

  return null
}

/**
 * 拾取屏幕坐标下的公交车站（带拾取窗口，便于密集点交互）
 * @param {Cesium.Viewer} viewer
 * @param {Cesium.BillboardCollection} collection
 * @param {Cesium.Cartesian2} windowPosition
 */
export function pickBusStation(viewer, collection, windowPosition) {
  const picked = viewer.scene.pick(windowPosition, PICK_WINDOW, PICK_WINDOW)
  return getBusBillboardFromPick(picked, collection)
}

/**
 * 清除公交车站图层
 * @param {Cesium.Viewer} viewer
 * @param {{ collection }} layer
 */
export function clearBusStations(viewer, layer) {
  if (!layer?.collection) return
  viewer.scene.primitives.remove(layer.collection)
  layer.collection = null
}
