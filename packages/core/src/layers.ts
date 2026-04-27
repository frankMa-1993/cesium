import * as Cesium from 'cesium'
import { TIANDITU_TOKEN } from './viewer'

/**
 * 添加天地图 WMTS 底图（影像 + 注记）
 */
export function addTiandituLayers(viewer: Cesium.Viewer): void {
  viewer.imageryLayers.removeAll()

  const imgLayer = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/img_w/wmts?tk=${TIANDITU_TOKEN}`,
    layer: 'img',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  })
  viewer.imageryLayers.addImageryProvider(imgLayer)

  const ciaLayer = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/cia_w/wmts?tk=${TIANDITU_TOKEN}`,
    layer: 'cia',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  })
  viewer.imageryLayers.addImageryProvider(ciaLayer)
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
