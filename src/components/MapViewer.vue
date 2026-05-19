<template>
  <div class="map-viewer">
    <div ref="cesiumContainer" class="cesium-container"></div>

    <!-- 左上：图层面板 -->
    <div class="map-overlay-left">
      <div class="layer-dd" ref="layerDdRef" :class="{ 'is-open': layerPanelOpen }">
        <button
          type="button"
          class="layer-dd__trigger"
          aria-haspopup="listbox"
          :aria-expanded="layerPanelOpen"
          @click.stop="layerPanelOpen = !layerPanelOpen"
        >
          <span class="layer-dd__trigger-text">基础图层</span>
          <svg class="layer-dd__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
        <div v-show="layerPanelOpen" class="layer-dd__panel" role="listbox" @click.stop>
          <label class="layer-dd__row">
            <input v-model="layerWater" type="checkbox" class="layer-dd__check" />
            <span>水域动画图层</span>
          </label>
          <label class="layer-dd__row">
            <input v-model="layerGaode" type="checkbox" class="layer-dd__check" />
            <span>高德影像图层</span>
          </label>
          <label class="layer-dd__row">
            <input v-model="layerFlood" type="checkbox" class="layer-dd__check" :disabled="floodLoading" />
            <span>
              积水内涝点
              <span v-if="floodLoading" class="layer-loading">加载中…</span>
            </span>
          </label>
          <label class="layer-dd__row">
            <input v-model="layerBus" type="checkbox" class="layer-dd__check" :disabled="busLoading" />
            <span>
              公交车站
              <span v-if="busLoading" class="layer-loading">加载中…</span>
              <span v-else-if="busLoadProgress > 0 && busLoadProgress < 100" class="layer-loading">
                {{ busLoadProgress }}%
              </span>
            </span>
          </label>
          <label class="layer-dd__row">
            <input v-model="layer3DTiles" type="checkbox" class="layer-dd__check" :disabled="tiles3dLoading" />
            <span>
              深圳3D建筑
              <span v-if="tiles3dLoading" class="layer-loading">加载中…</span>
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- 右上：重置视角 -->
    <div class="map-toolbar map-toolbar--tr">
      <button
        type="button"
        class="reset-camera-btn"
        :class="{ 'is-busy': cameraFlying }"
        title="重置视角"
        aria-label="重置视角"
        @click.stop="onResetView"
      >
        <span class="reset-camera-btn__spinner" aria-hidden="true" />
        <svg
          class="reset-camera-btn__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 5V2L8 6l4 4V7c2.76 0 5 2.24 5 5 0 1.38-.56 2.63-1.47 3.53l1.42 1.42A6.96 6.96 0 0 0 19 12c0-3.87-3.13-7-7-7zm-1.41 8.59L9.17 15A4.98 4.98 0 0 1 7 12c0-2.76 2.24-5 5-5v2l4-4-4-4v3c-3.87 0-7 3.13-7 7a6.95 6.95 0 0 0 2.06 4.94l1.41-1.35z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

    <!-- 积水内涝点悬停名称标签 -->
    <div
      v-if="floodTooltipVisible"
      class="map-point-tooltip"
      :style="floodTooltipStyle"
    >
      {{ floodTooltipName }}
    </div>

    <!-- 公交车站悬停名称标签 -->
    <div
      v-if="busTooltipVisible"
      class="map-point-tooltip bus-tooltip"
      :style="busTooltipStyle"
    >
      {{ busTooltipName }}
    </div>

    <!-- 公交车站详情弹窗 -->
    <div
      v-if="busPopupVisible"
      class="map-point-popup bus-popup"
      :style="busPopupStyle"
      @click.stop
    >
      <div class="popup-header">
        <span class="popup-title">{{ busPopupData.name }}</span>
        <button class="popup-close" @click="hideBusPopup">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-row">
          <span class="label">地址</span>
          <span class="value">{{ busPopupData.address }}</span>
        </div>
        <div class="popup-row">
          <span class="label">所属区域</span>
          <span class="value">{{ busPopupData.district }}</span>
        </div>
        <div class="popup-row">
          <span class="label">途经线路</span>
          <span class="value">{{ busRoutesText }}</span>
        </div>
        <div class="popup-row">
          <span class="label">运营状态</span>
          <span class="value" :style="busStatusStyle">{{ busStatusText }}</span>
        </div>
        <div class="popup-row">
          <span class="label">日客流量</span>
          <span class="value">{{ busPopupData.dailyPassengers }} 人次</span>
        </div>
        <div class="popup-row">
          <span class="label">候车亭</span>
          <span class="value">{{ busPopupData.shelter ? '有' : '无' }}</span>
        </div>
        <div class="popup-row">
          <span class="label">电子站牌</span>
          <span class="value">{{ busPopupData.electronicBoard ? '有' : '无' }}</span>
        </div>
        <div class="popup-row">
          <span class="label">更新时间</span>
          <span class="value">{{ busPopupData.updateTime }}</span>
        </div>
      </div>
    </div>

    <!-- 积水内涝点详情弹窗 -->
    <div
      v-if="floodPopupVisible"
      class="map-point-popup"
      :style="floodPopupStyle"
      @click.stop
    >
      <div class="popup-header">
        <span class="popup-title">{{ floodPopupData.name }}</span>
        <button class="popup-close" @click="hideFloodPopup">×</button>
      </div>
      <div class="popup-body">
        <div class="popup-row">
          <span class="label">地址</span>
          <span class="value">{{ floodPopupData.address }}</span>
        </div>
        <div class="popup-row">
          <span class="label">风险等级</span>
          <span class="value" :style="riskStyle">{{ floodPopupData.riskLevel }}</span>
        </div>
        <div class="popup-row">
          <span class="label">状态</span>
          <span class="value" :style="statusStyle">{{ floodStatusText }}</span>
        </div>
        <div class="popup-row">
          <span class="label">积水深度</span>
          <span class="value">{{ floodPopupData.depth }} cm</span>
        </div>
        <div class="popup-row">
          <span class="label">积水面积</span>
          <span class="value">{{ floodPopupData.area }} m²</span>
        </div>
        <div class="popup-row">
          <span class="label">所属区域</span>
          <span class="value">{{ floodPopupData.district }}</span>
        </div>
        <div class="popup-row">
          <span class="label">上报时间</span>
          <span class="value">{{ floodPopupData.reportTime }}</span>
        </div>
        <div class="popup-row">
          <span class="label">更新时间</span>
          <span class="value">{{ floodPopupData.updateTime }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  createViewer,
  addTiandituLayers,
  createGaodeSatelliteWmtsProvider,
  load3DTileset,
  flyTo3DTileset,
  get3DTilesetCenter,
} from '@/utils/cesium-init.js'
import * as Cesium from 'cesium'
import { addWaterSurface, removeWaterSurface } from '@/utils/cesium-water.js'
import {
  addShenzhenBoundaryLine,
  addShenzhenMask,
  setShenzhenCameraView,
  flyToShenzhenCameraView,
} from '@/utils/cesium-boundary.js'
import { loadFloodPoints, clearFloodPoints } from '@/utils/cesium-flood-points.js'
import {
  loadBusStations,
  clearBusStations,
  pickBusStation,
} from '@/utils/cesium-bus-stations.js'
import {
  fetchFloodPoints,
  fetchFloodPointDetail,
  fetchBusStations,
  fetchBusStationDetail,
} from '@/api/index.js'

const DEFAULT_VIEW_DURATION = 1.5
const RESET_DEBOUNCE_MS = 300
const FLOOD_BILLBOARD_SCALE = 1.0
const FLOOD_BILLBOARD_HOVER_SCALE = 2.0
const BUS_BILLBOARD_SCALE = 1.0
const BUS_BILLBOARD_HOVER_SCALE = 1.6
const MOUSE_MOVE_THROTTLE_MS = 32

const cesiumContainer = ref(null)
const layerDdRef = ref(null)
let viewer = null
let waterPrimitive = null
let gaodeImageryLayer = null
let floodLayer = null
let busLayer = null
let tileset3d = null
let clickDispatcher = null
let hoveredFloodEntity = null
let hoveredBusBillboard = null
let mouseMoveRafId = null
let lastMouseMoveAt = 0

const viewerReady = ref(false)
const layerPanelOpen = ref(false)
const layerWater = ref(false)
const layerGaode = ref(false)
const layerFlood = ref(false)
const layerBus = ref(false)
const layer3DTiles = ref(false)
const floodLoading = ref(false)
const busLoading = ref(false)
const busLoadProgress = ref(0)
const tiles3dLoading = ref(false)
const cameraFlying = ref(false)

// 积水内涝点弹窗
const floodPopupVisible = ref(false)
const floodPopupData = ref({})
const floodPopupPosition = ref({ x: 0, y: 0 })

// 积水内涝点悬停标签
const floodTooltipVisible = ref(false)
const floodTooltipName = ref('')
const floodTooltipPosition = ref({ x: 0, y: 0 })

const busPopupVisible = ref(false)
const busPopupData = ref({})
const busPopupPosition = ref({ x: 0, y: 0 })
const busTooltipVisible = ref(false)
const busTooltipName = ref('')
const busTooltipPosition = ref({ x: 0, y: 0 })

let resetCooldownUntil = 0

const floodPopupStyle = computed(() => ({
  left: `${floodPopupPosition.value.x + 18}px`,
  top: `${floodPopupPosition.value.y - 120}px`,
}))

const floodTooltipStyle = computed(() => ({
  left: `${floodTooltipPosition.value.x}px`,
  top: `${floodTooltipPosition.value.y}px`,
}))

const busPopupStyle = computed(() => ({
  left: `${busPopupPosition.value.x + 18}px`,
  top: `${busPopupPosition.value.y - 120}px`,
}))

const busTooltipStyle = computed(() => ({
  left: `${busTooltipPosition.value.x}px`,
  top: `${busTooltipPosition.value.y}px`,
}))

const busStatusText = computed(() => {
  const map = { normal: '正常运营', busy: '客流繁忙', maintenance: '维护中' }
  return map[busPopupData.value.status] || busPopupData.value.status
})

const busStatusStyle = computed(() => {
  const colors = { normal: '#52c41a', busy: '#ff9c00', maintenance: '#ff4d4f' }
  return { color: colors[busPopupData.value.status] || '#fff', fontWeight: '600' }
})

const busRoutesText = computed(() => {
  const routes = busPopupData.value.routes
  if (!routes) return '-'
  return Array.isArray(routes) ? routes.join('、') : routes
})

const floodStatusText = computed(() => {
  const map = { active: '积水中', warning: '预警', normal: '已消退' }
  return map[floodPopupData.value.status] || floodPopupData.value.status
})

const riskStyle = computed(() => {
  const colors = { '高': '#ff4d4f', '中': '#ff9c00', '低': '#1890ff' }
  return { color: colors[floodPopupData.value.riskLevel] || '#fff', fontWeight: '600' }
})

const statusStyle = computed(() => {
  const colors = { active: '#ff4d4f', warning: '#ff9c00', normal: '#52c41a' }
  return { color: colors[floodPopupData.value.status] || '#fff' }
})

function flyToShenzhenDefault() {
  if (!viewer) return
  flyToShenzhenCameraView(viewer, {
    duration: DEFAULT_VIEW_DURATION,
    complete: () => {
      cameraFlying.value = false
      resetCooldownUntil = Date.now() + RESET_DEBOUNCE_MS
    },
  })
}

function onResetView() {
  if (!viewer || cameraFlying.value || Date.now() < resetCooldownUntil) return
  cameraFlying.value = true
  flyToShenzhenDefault()
}

function setWaterLayer(show) {
  if (!viewer) return
  if (show) {
    if (!waterPrimitive) waterPrimitive = addWaterSurface(viewer)
  } else if (waterPrimitive) {
    removeWaterSurface(viewer, waterPrimitive)
    waterPrimitive = null
  }
}

function setGaodeLayer(show) {
  if (!viewer) return
  if (show) {
    if (gaodeImageryLayer) return
    const provider = createGaodeSatelliteWmtsProvider()
    gaodeImageryLayer = viewer.imageryLayers.addImageryProvider(provider)
    gaodeImageryLayer.alpha = 0.8
  } else if (gaodeImageryLayer) {
    viewer.imageryLayers.remove(gaodeImageryLayer)
    gaodeImageryLayer = null
  }
}

async function setFloodLayer(show) {
  if (!viewer) return
  if (show) {
    if (floodLayer) return
    floodLoading.value = true
    try {
      const res = await fetchFloodPoints()
      if (res.code === 200 && res.data) {
        floodLayer = loadFloodPoints(viewer, res.data)
      }
    } catch (e) {
      console.error('[MapViewer] 积水内涝点加载失败', e)
      layerFlood.value = false
    } finally {
      floodLoading.value = false
    }
  } else {
    hideFloodPopup()
    resetFloodHover()
    if (floodLayer) {
      clearFloodPoints(viewer, floodLayer)
      floodLayer = null
    }
  }
}

async function setBusLayer(show) {
  if (!viewer) return
  if (show) {
    if (busLayer) return
    busLoading.value = true
    busLoadProgress.value = 0
    try {
      const res = await fetchBusStations()
      if (res.code === 200 && res.data) {
        busLayer = await loadBusStations(viewer, res.data, {
          onProgress: (loaded, total) => {
            busLoadProgress.value = Math.round((loaded / total) * 100)
          },
        })
        busLoadProgress.value = 100
      }
    } catch (e) {
      console.error('[MapViewer] 公交车站加载失败', e)
      layerBus.value = false
    } finally {
      busLoading.value = false
    }
  } else {
    hideBusPopup()
    resetBusHover()
    busLoadProgress.value = 0
    if (busLayer) {
      clearBusStations(viewer, busLayer)
      busLayer = null
    }
  }
}

async function onFloodPointClick(properties, screenPos) {
  const id = getEntityProperty(properties, 'id')
  if (!id) return

  try {
    const res = await fetchFloodPointDetail(id)
    if (res.code === 200 && res.data) {
      floodPopupData.value = res.data
      floodPopupVisible.value = true
      floodPopupPosition.value = { x: screenPos.x, y: screenPos.y }
    }
  } catch (e) {
    console.error('[MapViewer] 积水内涝点详情加载失败', e)
  }
}

function hideFloodPopup() {
  floodPopupVisible.value = false
}

async function onBusStationClick(meta, screenPos) {
  const id = meta?.id
  if (!id) return

  try {
    const res = await fetchBusStationDetail(id)
    if (res.code === 200 && res.data) {
      busPopupData.value = res.data
      busPopupVisible.value = true
      busPopupPosition.value = { x: screenPos.x, y: screenPos.y }
    }
  } catch (e) {
    console.error('[MapViewer] 公交车站详情加载失败', e)
  }
}

function hideBusPopup() {
  busPopupVisible.value = false
}

function resetFloodHover() {
  if (hoveredFloodEntity && hoveredFloodEntity.billboard) {
    hoveredFloodEntity.billboard.scale = FLOOD_BILLBOARD_SCALE
  }
  hoveredFloodEntity = null
  floodTooltipVisible.value = false
  floodTooltipName.value = ''
  if (viewer && viewer.canvas && !hoveredBusBillboard) {
    viewer.canvas.style.cursor = ''
  }
}

function setFloodHover(entity, screenPos) {
  if (hoveredFloodEntity === entity) {
    floodTooltipPosition.value = { x: screenPos.x, y: screenPos.y }
    return
  }

  resetFloodHover()
  hoveredFloodEntity = entity
  if (entity.billboard) {
    entity.billboard.scale = FLOOD_BILLBOARD_HOVER_SCALE
  }

  floodTooltipName.value = getEntityProperty(entity.properties, 'name') || ''
  floodTooltipVisible.value = true
  floodTooltipPosition.value = { x: screenPos.x, y: screenPos.y }
  if (viewer && viewer.canvas) {
    viewer.canvas.style.cursor = 'pointer'
  }
}

function resetBusHover() {
  if (hoveredBusBillboard) {
    hoveredBusBillboard.scale = hoveredBusBillboard._baseScale ?? BUS_BILLBOARD_SCALE
    hoveredBusBillboard = null
  }
  busTooltipVisible.value = false
  busTooltipName.value = ''
  if (viewer && viewer.canvas && !hoveredFloodEntity) {
    viewer.canvas.style.cursor = ''
  }
}

function setBusHover(billboard, screenPos) {
  if (hoveredBusBillboard === billboard) {
    busTooltipPosition.value = { x: screenPos.x, y: screenPos.y }
    return
  }

  resetBusHover()
  hoveredBusBillboard = billboard
  const base = billboard._baseScale ?? BUS_BILLBOARD_SCALE
  billboard.scale = base * BUS_BILLBOARD_HOVER_SCALE

  busTooltipName.value = billboard._meta?.name || ''
  busTooltipVisible.value = true
  busTooltipPosition.value = { x: screenPos.x, y: screenPos.y }
  if (viewer && viewer.canvas) {
    viewer.canvas.style.cursor = 'pointer'
  }
}

function resetAllHover() {
  resetFloodHover()
  resetBusHover()
}

function getEntityProperty(properties, key) {
  const property = properties && properties[key]
  if (!property) return undefined
  if (typeof property.getValue === 'function') {
    return property.getValue(viewer.clock.currentTime)
  }
  return property
}

function dispatchMapClick(click) {
  if (layerBus.value && busLayer?.collection) {
    const busBillboard = pickBusStation(viewer, busLayer.collection, click.position)
    if (busBillboard) {
      hideFloodPopup()
      onBusStationClick(busBillboard._meta, click.position)
      return
    }
  }

  const picked = viewer.scene.pick(click.position)
  if (!Cesium.defined(picked)) {
    hideBusPopup()
    return
  }

  if (!picked.id || !picked.id.properties) {
    hideBusPopup()
    return
  }

  const properties = picked.id.properties
  const layerType = getEntityProperty(properties, 'layerType')

  if (layerType === 'floodPoint') {
    hideBusPopup()
    onFloodPointClick(properties, click.position)
  } else {
    hideBusPopup()
  }
}

function handleMapMouseMove(movement) {
  const hasFlood = layerFlood.value && floodLayer
  const hasBus = layerBus.value && busLayer?.collection

  if (!hasFlood && !hasBus) {
    resetAllHover()
    return
  }

  if (hasBus) {
    const busBillboard = pickBusStation(viewer, busLayer.collection, movement.endPosition)
    if (busBillboard) {
      resetFloodHover()
      setBusHover(busBillboard, movement.endPosition)
      return
    }
    resetBusHover()
  }

  const picked = viewer.scene.pick(movement.endPosition)

  if (hasFlood) {
    if (!Cesium.defined(picked) || !picked.id || !picked.id.properties) {
      resetFloodHover()
      return
    }

    const layerType = getEntityProperty(picked.id.properties, 'layerType')
    if (layerType !== 'floodPoint') {
      resetFloodHover()
      return
    }

    resetBusHover()
    setFloodHover(picked.id, movement.endPosition)
    return
  }

  resetFloodHover()
}

function dispatchMapMouseMove(movement) {
  const now = performance.now()
  if (now - lastMouseMoveAt < MOUSE_MOVE_THROTTLE_MS) {
    if (mouseMoveRafId) return
    mouseMoveRafId = requestAnimationFrame(() => {
      mouseMoveRafId = null
      lastMouseMoveAt = performance.now()
      handleMapMouseMove(movement)
    })
    return
  }
  lastMouseMoveAt = now
  handleMapMouseMove(movement)
}

function setupMapClickDispatcher() {
  if (!viewer || clickDispatcher) return
  clickDispatcher = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
  clickDispatcher.setInputAction(dispatchMapClick, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  clickDispatcher.setInputAction(dispatchMapMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  clickDispatcher.setInputAction(() => resetAllHover(), Cesium.ScreenSpaceEventType.MOUSE_OUT)
}

async function set3DTilesLayer(show) {
  if (!viewer) return
  if (show) {
    if (tileset3d) return
    tiles3dLoading.value = true
    try {
      const url = import.meta.env.VITE_3DTILES_URL
      tileset3d = await load3DTileset({ url: url || undefined })
      viewer.scene.primitives.add(tileset3d)

      const center = get3DTilesetCenter(tileset3d)
      console.info('[MapViewer] 3D Tiles 中心', center.lon.toFixed(5), center.lat.toFixed(5))

      cameraFlying.value = true
      await flyTo3DTileset(viewer, tileset3d, {
        duration: DEFAULT_VIEW_DURATION,
        complete: () => {
          cameraFlying.value = false
          resetCooldownUntil = Date.now() + RESET_DEBOUNCE_MS
        },
      })
    } catch (e) {
      console.error('[MapViewer] 3D Tiles 加载失败', e)
      layer3DTiles.value = false
      cameraFlying.value = false
    } finally {
      tiles3dLoading.value = false
    }
  } else {
    if (tileset3d) {
      viewer.scene.primitives.remove(tileset3d)
      tileset3d = null
    }
  }
}

watch(layerWater, (show) => setWaterLayer(show))
watch(layerGaode, (show) => setGaodeLayer(show))
watch(layerFlood, (show) => setFloodLayer(show))
watch(layerBus, (show) => setBusLayer(show))
watch(layer3DTiles, (show) => set3DTilesLayer(show))

async function initMap() {
  viewer = createViewer(cesiumContainer.value)
  // 创建后立即定位深圳，避免默认全球视角；底图/地形加载期间保持该视角
  setShenzhenCameraView(viewer)

  await addTiandituLayers(viewer)

  try {
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
      requestWaterMask: false,
      requestVertexNormals: true,
    })
  } catch (e) {
    console.warn('[MapViewer] World Terrain 不可用，使用椭球地形', e)
  }

  if (layerWater.value) {
    waterPrimitive = addWaterSurface(viewer)
  }

  addShenzhenMask(viewer)
  addShenzhenBoundaryLine(viewer)
  setupMapClickDispatcher()

  viewerReady.value = true
}

function onDocumentClick(e) {
  const el = layerDdRef.value
  if (el && !el.contains(e.target)) {
    layerPanelOpen.value = false
  }
}

onMounted(() => {
  initMap()
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  if (mouseMoveRafId) {
    cancelAnimationFrame(mouseMoveRafId)
    mouseMoveRafId = null
  }
  resetAllHover()
  if (floodLayer && viewer) {
    clearFloodPoints(viewer, floodLayer)
    floodLayer = null
  }
  if (busLayer && viewer) {
    clearBusStations(viewer, busLayer)
    busLayer = null
  }
  if (tileset3d && viewer) {
    viewer.scene.primitives.remove(tileset3d)
    tileset3d = null
  }
  if (clickDispatcher && !clickDispatcher.isDestroyed()) {
    clickDispatcher.destroy()
    clickDispatcher = null
  }
  if (viewer && gaodeImageryLayer) {
    viewer.imageryLayers.remove(gaodeImageryLayer)
    gaodeImageryLayer = null
  }
  if (viewer && waterPrimitive) {
    removeWaterSurface(viewer, waterPrimitive)
    waterPrimitive = null
  }
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped lang="scss">
@use "@/styles/vars.scss" as *;

.map-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cesium-container {
  width: 100%;
  height: 100%;
}

.map-overlay-left {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  pointer-events: none;
  max-width: calc(100% - 56px);

  > * {
    pointer-events: auto;
  }
}

.map-toolbar {
  position: absolute;
  z-index: 30;
  pointer-events: auto;
}

.map-toolbar--tr {
  top: 12px;
  right: 12px;
}

.layer-dd {
  position: relative;
  width: 200px;

  &.is-open .layer-dd__chevron {
    transform: rotate(180deg);
  }
}

.layer-dd__trigger {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 6px;
  border: 1px solid $border-color;
  background: rgba(6, 22, 48, 0.94);
  backdrop-filter: blur(8px);
  color: $text-primary;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);

  &:hover {
    border-color: rgba(0, 240, 255, 0.45);
    color: $primary;
  }
}

.layer-dd__trigger-text {
  flex: 1;
  min-width: 0;
}

.layer-dd__chevron {
  flex-shrink: 0;
  opacity: 0.85;
  transition: transform 0.2s ease;
}

.layer-dd__panel {
  margin-top: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid $border-color;
  background: rgba(6, 22, 48, 0.97);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.layer-dd__row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: $text-secondary;
  cursor: pointer;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 240, 255, 0.08);

  &:last-child {
    border-bottom: none;
    padding-bottom: 4px;
  }
  &:first-child {
    padding-top: 4px;
  }

  .layer-dd__check {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    accent-color: $primary;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}

.layer-loading {
  font-size: 10px;
  color: $primary;
  margin-left: 4px;
  opacity: 0.8;
}

.reset-camera-btn {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid $border-color;
  background: rgba(6, 22, 48, 0.92);
  color: $text-primary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: rgba(0, 240, 255, 0.45);
    color: $primary;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    color: $text-muted;
  }

  &.is-busy .reset-camera-btn__icon {
    opacity: 0.2;
  }

  &.is-busy .reset-camera-btn__spinner {
    opacity: 1;
  }
}

.reset-camera-btn__icon {
  position: relative;
  z-index: 1;
}

.reset-camera-btn__spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 240, 255, 0.25);
  border-top-color: $primary;
  border-radius: 50%;
  opacity: 0;
  animation: map-spin 0.7s linear infinite;
  z-index: 2;
}

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

// 地图点位悬停名称标签
.map-point-tooltip {
  position: absolute;
  z-index: 45;
  max-width: 220px;
  padding: 6px 12px;
  transform: translate(-50%, calc(-100% - 14px));
  background: rgba(4, 14, 36, 0.94);
  border: 1px solid rgba(24, 144, 255, 0.55);
  border-radius: 6px;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.45),
    0 0 12px rgba(24, 144, 255, 0.2);
  backdrop-filter: blur(8px);
  pointer-events: none;
  font-size: 12px;
  font-weight: 600;
  color: #e6f4ff;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    transform: translateX(-50%);
    border-width: 6px 6px 0;
    border-style: solid;
    border-color: rgba(24, 144, 255, 0.55) transparent transparent;
  }
}

.bus-tooltip {
  border-color: rgba(82, 196, 26, 0.55);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.45),
    0 0 12px rgba(82, 196, 26, 0.2);

  &::after {
    border-color: rgba(82, 196, 26, 0.55) transparent transparent;
  }
}

// 地图点位详情弹窗
.map-point-popup {
  position: absolute;
  z-index: 50;
  width: 260px;
  background: rgba(4, 14, 36, 0.96);
  border: 1px solid rgba(24, 144, 255, 0.5);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(24, 144, 255, 0.15);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  overflow: hidden;

  &::before {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1890ff, transparent);
  }
}

.bus-popup {
  border-color: rgba(82, 196, 26, 0.5);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(82, 196, 26, 0.15);

  &::before {
    background: linear-gradient(90deg, transparent, #52c41a, transparent);
  }

  .popup-title {
    color: #52c41a;
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.18);
}

.popup-title {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 0.04em;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-close {
  appearance: none;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.45);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 8px;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover {
    color: #fff;
  }
}

.popup-body {
  padding: 8px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.popup-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;

  .label {
    flex-shrink: 0;
    width: 64px;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.5;
  }

  .value {
    flex: 1;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
    word-break: break-all;
  }
}
</style>
