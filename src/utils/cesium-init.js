import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { addWaterSurface, removeWaterSurface } from './cesium-water.js'

// 全局 Cesium 配置（须在 Ion 地形等请求前执行；可与 .env 中 VITE_CESIUM_ION_TOKEN 配合）
const CESIUM_ION_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MTAwZGU0Zi04MzQzLTRhZTItYWY0ZS1mODU3Mzg2NjhiMWIiLCJpZCI6MTk3ODkzLCJpYXQiOjE3NzczNzAwNjV9.ZfVooVU2KF-yIEmVYsbhYugDiYCqiv44xnn4pj2ibhI'
Cesium.Ion.defaultAccessToken =
  import.meta.env.VITE_CESIUM_ION_TOKEN || CESIUM_ION_FALLBACK

const TIANDITU_PLACEHOLDER = 'your_tianditu_token_here'

function resolveTiandituToken() {
  const fromEnv = (import.meta.env.VITE_TIANDITU_TOKEN || '').trim()
  const fromDefine = (typeof __TIANDITU_TOKEN__ !== 'undefined' ? __TIANDITU_TOKEN__ : '').trim()
  const raw = fromEnv || fromDefine
  if (!raw || raw === TIANDITU_PLACEHOLDER) return ''
  return raw
}

async function probeTianditu(token) {
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

function addTiandituStack(viewer, token) {
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

function tryAddIonWorldImagery(viewer) {
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

function addOpenStreetMapBasemap(viewer) {
  viewer.imageryLayers.addImageryProvider(
    new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
    })
  )
}

/**
 * 创建 Viewer
 * @param {string|HTMLElement} container
 * @param {object} options
 */
export function createViewer(container, options = {}) {
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

  // 隐藏版权信息
  viewer.cesiumWidget.creditContainer.style.display = 'none'

  // 开启深度检测
  viewer.scene.globe.depthTestAgainstTerrain = false

  // 启用光照
  viewer.scene.globe.enableLighting = false

  // 关闭雾效和大气，提升性能
  viewer.scene.fog.enabled = false
  viewer.scene.skyAtmosphere.show = true

  // 关闭快速近似抗锯齿（FXAA）由 postProcessStages 控制
  viewer.scene.postProcessStages.fxaa.enabled = true

  return viewer
}

/**
 * 添加天地图 WMTS 底图（影像 + 注记）；无效 key 或探测失败时回退 Ion 全球影像再 OSM。
 * @param {Cesium.Viewer} viewer
 * @returns {Promise<void>}
 */
export async function addTiandituLayers(viewer) {
  viewer.imageryLayers.removeAll()

  const token = resolveTiandituToken()

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
 * 高德卫星影像（REST 模板，由 WebMapTileServiceImageryProvider 解析 {TileCol}/{TileRow}/{TileMatrix}）
 * 层级 0–18；叠加时请设置 ImageryLayer.alpha（如 0.8）以与底图/地形混合。
 */
export function createGaodeSatelliteWmtsProvider() {
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

/**
 * 相机飞行到指定位置
 * @param {Cesium.Viewer} viewer
 * @param {number} lon
 * @param {number} lat
 * @param {number} height
 * @param {number} duration
 */
export function flyTo(viewer, lon, lat, height = 100000, duration = 1.5) {
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
 * @param {Cesium.Viewer} viewer
 */
export function flyToChina(viewer) {
  flyTo(viewer, 105, 35, 5000000, 2)
}

/** 深圳 3D 建筑默认瓦片地址（Ion 资产 2464651） */
export const DEFAULT_3DTILES_URL =
  'https://assets.ion.cesium.com/ap-northeast-1/2464651/tileset.json?v=1'

function resolve3DTilesAuthHeader(authToken) {
  const raw = (authToken ?? import.meta.env.VITE_3DTILES_AUTH_TOKEN ?? '').trim()
  if (!raw) return null
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`
}

/**
 * 将 tileset URL 包装为带 Authorization 的 Resource（子瓦片请求会继承 headers）
 * @param {string} url
 * @param {string} [authToken]
 */
export function create3DTilesResource(url, authToken) {
  const authorization = resolve3DTilesAuthHeader(authToken)
  if (!authorization) return url
  return new Cesium.Resource({
    url,
    headers: { Authorization: authorization },
  })
}

/**
 * 加载 3D Tiles（兼容 Cesium 1.100：无 fromUrl / fromIonAssetId 静态方法）
 * @param {{ url?: string, ionAssetId?: number, authToken?: string }} options
 * @returns {Promise<Cesium.Cesium3DTileset>}
 */
export async function load3DTileset(options = {}) {
  const { url = DEFAULT_3DTILES_URL, ionAssetId, authToken } = options

  let tilesetUrl = url
  if (!tilesetUrl && ionAssetId != null) {
    tilesetUrl = await Cesium.IonResource.fromAssetId(ionAssetId)
  }

  const tileset = new Cesium.Cesium3DTileset({
    url: create3DTilesResource(tilesetUrl, authToken),
  })
  await tileset.readyPromise
  return tileset
}

/**
 * 从已加载的 3D Tiles 包围球解析中心经纬度（数据来自 tileset 根节点边界）
 * @param {Cesium.Cesium3DTileset} tileset
 */
export function get3DTilesetCenter(tileset) {
  const carto = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center)
  return {
    lon: Cesium.Math.toDegrees(carto.longitude),
    lat: Cesium.Math.toDegrees(carto.latitude),
    height: carto.height,
  }
}

/**
 * 相机飞行到 3D Tiles 所在区域（基于 tileset 边界球，无需手写经纬度）
 * @param {Cesium.Viewer} viewer
 * @param {Cesium.Cesium3DTileset} tileset
 * @param {{ duration?: number, complete?: () => void }} [options]
 */
export async function flyTo3DTileset(viewer, tileset, options = {}) {
  const { duration = 1.5, complete } = options
  const offset = new Cesium.HeadingPitchRange(
    0,
    Cesium.Math.toRadians(-45),
    tileset.boundingSphere.radius * 2.2,
  )
  const flight = viewer.flyTo(tileset, { duration, offset })
  if (flight && typeof flight.then === 'function') {
    await flight
  }
  complete?.()
}

/**
 * 全局 Vue 插件，暴露 $cesium 方法
 */
export const cesiumPlugin = {
  install(app) {
    app.config.globalProperties.$cesium = {
      createViewer,
      addTiandituLayers,
      createGaodeSatelliteWmtsProvider,
      flyTo,
      flyToChina,
      addWaterSurface,
      removeWaterSurface,
    }
  },
}

