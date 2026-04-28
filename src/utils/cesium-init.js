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
 * 加载 GeoJSON 点位并渲染为 Billboard
 * @param {Cesium.Viewer} viewer
 * @param {object} geojson
 * @param {Function} onClick
 */
export function loadBillboardPoints(viewer, geojson, onClick) {
  const dataSource = new Cesium.CustomDataSource('points')

  geojson.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates
    const props = feature.properties

    const entity = dataSource.entities.add({
      id: feature.id || props.id,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: createPointCanvas(props.status),
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      properties: props,
    })

    // 存储引用便于后续更新
    entity.pointProps = props
  })

  viewer.dataSources.add(dataSource)

  // 点击事件
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
  handler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position)
    if (Cesium.defined(picked) && picked.id && picked.id.properties) {
      const cartesian = picked.id.position.getValue(viewer.clock.currentTime)
      onClick && onClick(picked.id, cartesian)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  return { dataSource, handler }
}

/**
 * 创建点位 Canvas 图标
 * @param {string} status online | warning | danger
 */
function createPointCanvas(status) {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  let color = '#00f0ff'
  if (status === 'warning') color = '#ff9c00'
  if (status === 'danger') color = '#ff4d4f'

  // 外发光
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.5, color + '80')
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // 中心圆
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()

  return canvas
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

/**
 * 全局 Vue 插件，暴露 $cesium 方法
 */
export const cesiumPlugin = {
  install(app) {
    app.config.globalProperties.$cesium = {
      createViewer,
      addTiandituLayers,
      createGaodeSatelliteWmtsProvider,
      loadBillboardPoints,
      flyTo,
      flyToChina,
      addWaterSurface,
      removeWaterSurface,
    }
  },
}

