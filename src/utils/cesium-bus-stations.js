import * as Cesium from 'cesium'

const BUS_ICON_URL = '/car.png'
const BATCH_SIZE = 800

/** 等待 Primitive 与 scene/globe 完成绑定后再添加带 heightReference 的 Billboard */
function waitForPrimitiveScene(viewer) {
  return new Promise((resolve) => {
    const onPostRender = () => {
      viewer.scene.postRender.removeEventListener(onPostRender)
      resolve()
    }
    viewer.scene.postRender.addEventListener(onPostRender)
  })
}

/**
 * 公交车站图层：BillboardCollection 批量渲染，适合 1 万级点位
 * @param {Cesium.Viewer} viewer
 * @param {object} geojson - FeatureCollection
 * @param {{ onProgress?: (loaded: number, total: number) => void }} [options]
 * @returns {Promise<{ collection: Cesium.BillboardCollection }>}
 */
export async function loadBusStations(viewer, geojson, options = {}) {
  const collection = new Cesium.BillboardCollection()
  viewer.scene.primitives.add(collection)
  // 须等 collection 挂到 scene 后再设置 CLAMP_TO_GROUND，否则会抛 DeveloperError
  await waitForPrimitiveScene(viewer)

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
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        // 远景缩小，减轻密集区域视觉压力
        scaleByDistance: new Cesium.NearFarScalar(800, 1.2, 12000, 0.55),
      })

      billboard._meta = {
        ...props,
        layerType: 'busStation',
      }
    }

    options.onProgress?.(end, total)
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }

  return { collection }
}

/**
 * 从 pick 结果解析公交车站 Billboard
 * @param {object} picked
 * @param {Cesium.BillboardCollection} collection
 */
export function getBusBillboardFromPick(picked, collection) {
  if (!picked || picked.primitive !== collection) return null
  const billboard = picked.id
  if (!billboard || !billboard._meta || billboard._meta.layerType !== 'busStation') {
    return null
  }
  return billboard
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
