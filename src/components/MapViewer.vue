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
        :disabled="!viewerReady || cameraFlying"
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

    <!-- 积水内涝点详情弹窗 -->
    <div
      v-if="floodPopupVisible"
      class="flood-popup"
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
} from '@/utils/cesium-init.js'
import * as Cesium from 'cesium'
import {
  addWaterSurface,
  removeWaterSurface,
  SHENZHEN_CENTER_LON,
  SHENZHEN_CENTER_LAT,
} from '@/utils/cesium-water.js'
import { addShenzhenBoundaryLine, addShenzhenMask } from '@/utils/cesium-boundary.js'
import { loadFloodPoints, clearFloodPoints } from '@/utils/cesium-flood-points.js'
import { fetchFloodPoints, fetchFloodPointDetail } from '@/api/index.js'

const DEFAULT_VIEW_HEIGHT = 5000
const DEFAULT_VIEW_DURATION = 1.5
const RESET_DEBOUNCE_MS = 300

const cesiumContainer = ref(null)
const layerDdRef = ref(null)
let viewer = null
let waterPrimitive = null
let gaodeImageryLayer = null
let floodLayer = null
let tileset3d = null

const viewerReady = ref(false)
const layerPanelOpen = ref(false)
const layerWater = ref(true)
const layerGaode = ref(false)
const layerFlood = ref(false)
const layer3DTiles = ref(false)
const floodLoading = ref(false)
const tiles3dLoading = ref(false)
const cameraFlying = ref(false)

// 积水内涝点弹窗
const floodPopupVisible = ref(false)
const floodPopupData = ref({})
const floodPopupPosition = ref({ x: 0, y: 0 })

let resetCooldownUntil = 0

const floodPopupStyle = computed(() => ({
  left: `${floodPopupPosition.value.x + 18}px`,
  top: `${floodPopupPosition.value.y - 120}px`,
}))

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
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      SHENZHEN_CENTER_LON,
      SHENZHEN_CENTER_LAT,
      DEFAULT_VIEW_HEIGHT
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
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
        // debugger
      const res = await fetchFloodPoints()
      if (res.code === 200 && res.data) {
        floodLayer = loadFloodPoints(viewer, res.data, onFloodPointClick)
      }
    } catch (e) {
      console.error('[MapViewer] 积水内涝点加载失败', e)
      layerFlood.value = false
    } finally {
      floodLoading.value = false
    }
  } else {
    hideFloodPopup()
    if (floodLayer) {
      clearFloodPoints(viewer, floodLayer)
      floodLayer = null
    }
  }
}

async function onFloodPointClick(properties, screenPos) {
  const id = properties.id ? properties.id.getValue() : null
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

async function set3DTilesLayer(show) {
  if (!viewer) return
  if (show) {
    if (tileset3d) return
    tiles3dLoading.value = true
    try {
      const url = import.meta.env.VITE_3DTILES_URL
      if (url) {
        tileset3d = await Cesium.Cesium3DTileset.fromUrl(url)
      } else {
        tileset3d = await Cesium.Cesium3DTileset.fromIonAssetId(96188)
      }
      viewer.scene.primitives.add(tileset3d)
    } catch (e) {
      console.error('[MapViewer] 3D Tiles 加载失败', e)
      layer3DTiles.value = false
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
watch(layer3DTiles, (show) => set3DTilesLayer(show))

async function initMap() {
  viewer = createViewer(cesiumContainer.value)
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

  cameraFlying.value = true
  flyToShenzhenDefault()

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
  if (floodLayer && viewer) {
    clearFloodPoints(viewer, floodLayer)
    floodLayer = null
  }
  if (tileset3d && viewer) {
    viewer.scene.primitives.remove(tileset3d)
    tileset3d = null
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

// 积水内涝点弹窗
.flood-popup {
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
