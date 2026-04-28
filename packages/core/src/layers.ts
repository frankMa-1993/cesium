import * as Cesium from 'cesium'
import { TIANDITU_TOKEN } from './viewer'

async function probeTianditu(token: string): Promise<{ ok: boolean; status: number }> {
  const u = `https://t0.tianditu.gov.cn/img_w/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=img&style=default&tilematrixset=w&tilematrix=1&tilerow=0&tilecol=1&format=tiles&tk=${encodeURIComponent(token)}`
  const ac = new AbortController()
  const tid = setTimeout(() => ac.abort(), 8000)
  try {
    const r = await fetch(u, { signal: ac.signal, cache: 'no-store' })
    return { ok: r.ok, status: r.status }
  } catch {
    return { ok: false, status: 0 }
  } finally {
    clearTimeout(tid)
  }
}

function addTiandituStack(viewer: Cesium.Viewer, token: string): void {
  const imgLayer = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/img_w/wmts?tk=${token}`,
    layer: 'img',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  })
  viewer.imageryLayers.addImageryProvider(imgLayer)

  const ciaLayer = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/cia_w/wmts?tk=${token}`,
    layer: 'cia',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  })
  viewer.imageryLayers.addImageryProvider(ciaLayer)
}

/** Ion 托管的全球影像（底层多为 Bing），需有效 Cesium Ion token */
function tryAddIonWorldImagery(viewer: Cesium.Viewer): boolean {
  try {
    viewer.imageryLayers.addImageryProvider(
      Cesium.createWorldImagery({
        style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS,
      })
    )
    return true
  } catch {
    return false
  }
}

function addOpenStreetMapBasemap(viewer: Cesium.Viewer): void {
  viewer.imageryLayers.addImageryProvider(
    new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
    })
  )
}

/**
 * 添加天地图 WMTS 底图（影像 + 注记）；token 无效或瓦片探测失败时回退 Ion 全球影像再回退 OSM。
 */
export async function addTiandituLayers(viewer: Cesium.Viewer): Promise<void> {
  viewer.imageryLayers.removeAll()

  const token = TIANDITU_TOKEN

  const useFallback = () => {
    if (!tryAddIonWorldImagery(viewer)) {
      addOpenStreetMapBasemap(viewer)
    }
  }

  if (!token) {
    useFallback()
    return
  }

  const probe = await probeTianditu(token)

  if (!probe.ok) {
    useFallback()
    return
  }

  addTiandituStack(viewer, token)
}

/**
 * 高德卫星影像 WMTS Provider
 */
export function createGaodeSatelliteWmtsProvider(): Cesium.WebMapTileServiceImageryProvider {
  return new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={TileCol}&y={TileRow}&z={TileMatrix}',
    layer: 'img',
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'w',
    subdomains: ['1', '2', '3', '4'],
    minimumLevel: 0,
    maximumLevel: 18,
    credit: '高德地图',
  })
}
