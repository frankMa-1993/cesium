<template>
  <div class="map-viewer">
    <div ref="cesiumContainer" class="cesium-container"></div>

    <!-- 顶部：图层下拉 -->
    <div class="map-toolbar map-toolbar--top">
      <div class="layer-dd" ref="layerDdRef">
        <button
          type="button"
          class="layer-dd__trigger"
          aria-haspopup="listbox"
          :aria-expanded="layerPanelOpen"
          @click.stop="layerPanelOpen = !layerPanelOpen"
        >
          基础图层
        </button>
        <div v-show="layerPanelOpen" class="layer-dd__panel" role="listbox" @click.stop>
          <label class="layer-dd__row">
            <input v-model="layerWater" type="checkbox" />
            <span>水域动画图层</span>
          </label>
          <label class="layer-dd__row">
            <input v-model="layerGaode" type="checkbox" />
            <span>高德影像图层</span>
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

    <!-- 自定义气泡窗口 -->
    <div
      v-if="popupVisible"
      class="cesium-popup"
      :style="popupStyle"
    >
      <div class="popup-title">{{ popupData.name }}</div>
      <div class="popup-row">
        <span class="label">状态</span>
        <span class="value" :style="statusStyle">{{ statusText }}</span>
      </div>
      <div class="popup-row">
        <span class="label">类型</span>
        <span class="value">{{ popupData.type }}</span>
      </div>
      <div class="popup-row">
        <span class="label">实时值</span>
        <span class="value">{{ popupData.value }} {{ popupData.unit }}</span>
      </div>
      <div class="popup-row">
        <span class="label">经度</span>
        <span class="value">{{ popupData.lon?.toFixed(4) }}</span>
      </div>
      <div class="popup-row">
        <span class="label">纬度</span>
        <span class="value">{{ popupData.lat?.toFixed(4) }}</span>
      </div>
      <div class="popup-row">
        <span class="label">更新时间</span>
        <span class="value">{{ popupData.updateTime }}</span>
      </div>
    </div>

    <!-- 图例 -->
    <div class="map-legend">
      <div class="legend-item">
        <span class="dot online"></span>
        <span>正常</span>
      </div>
      <div class="legend-item">
        <span class="dot warning"></span>
        <span>预警</span>
      </div>
      <div class="legend-item">
        <span class="dot danger"></span>
        <span>告警</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as Cesium from 'cesium'
import {
  createViewer,
  addTiandituLayers,
  createGaodeSatelliteWmtsProvider,
  loadBillboardPoints,
} from '@/utils/cesium-init.js'
import {
  addWaterSurface,
  removeWaterSurface,
  SHENZHEN_CENTER_LON,
  SHENZHEN_CENTER_LAT,
} from '@/utils/cesium-water.js'
import { fetchPoints, fetchPointDetail } from '@/api/index.js'

const DEFAULT_VIEW_HEIGHT = 5000
const DEFAULT_VIEW_DURATION = 1.5
const RESET_DEBOUNCE_MS = 300

const cesiumContainer = ref(null)
const layerDdRef = ref(null)
let viewer = null
let pointLayer = null
let waterPrimitive = null
let gaodeImageryLayer = null

const viewerReady = ref(false)
const layerPanelOpen = ref(false)
const layerWater = ref(true)
const layerGaode = ref(false)
const cameraFlying = ref(false)

const popupVisible = ref(false)
const popupData = ref({})
const popupPosition = ref({ x: 0, y: 0 })

let resetCooldownUntil = 0

const popupStyle = computed(() => ({
  left: `${popupPosition.value.x + 15}px`,
  top: `${popupPosition.value.y - 100}px`,
}))

const statusText = computed(() => {
  const map = { online: '正常', warning: '预警', danger: '告警' }
  return map[popupData.value.status] || popupData.value.status
})

const statusStyle = computed(() => {
  const colors = {
    online: '#00f0ff',
    warning: '#ff9c00',
    danger: '#ff4d4f',
  }
  return { color: colors[popupData.value.status] || '#fff' }
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

watch(layerWater, (show) => setWaterLayer(show))
watch(layerGaode, (show) => setGaodeLayer(show))

async function initMap() {
  viewer = createViewer(cesiumContainer.value)
  addTiandituLayers(viewer)

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

  cameraFlying.value = true
  flyToShenzhenDefault()

  viewerReady.value = true

  const res = await fetchPoints()
  if (res.code === 200 && res.data) {
    pointLayer = loadBillboardPoints(viewer, res.data, onPointClick)
  }
}

async function onPointClick(entity, cartesian) {
  const id = entity.id
  const res = await fetchPointDetail(id)
  if (res.code === 200 && res.data) {
    popupData.value = res.data
    popupVisible.value = true

    const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      viewer.scene,
      cartesian
    )
    if (screenPos) {
      popupPosition.value = { x: screenPos.x, y: screenPos.y }
    }
  }
}

function hidePopup() {
  popupVisible.value = false
}

function onDocumentClick(e) {
  hidePopup()
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
  if (pointLayer && viewer) {
    pointLayer.handler.destroy()
    viewer.dataSources.remove(pointLayer.dataSource)
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

.map-toolbar {
  position: absolute;
  z-index: 30;
  pointer-events: auto;
}

.map-toolbar--top {
  top: 12px;
  left: 12px;
}

.map-toolbar--tr {
  top: 12px;
  right: 12px;
}

.layer-dd {
  position: relative;
}

.layer-dd__trigger {
  width: 160px;
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid $border-color;
  background: rgba(6, 22, 48, 0.92);
  color: $text-primary;
  font-size: 13px;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: rgba(0, 240, 255, 0.45);
  }
}

.layer-dd__panel {
  margin-top: 6px;
  min-width: 160px;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid $border-color;
  background: rgba(6, 22, 48, 0.96);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.layer-dd__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $text-secondary;
  cursor: pointer;
  padding: 6px 0;

  &:first-child {
    padding-top: 2px;
  }
  &:last-child {
    padding-bottom: 2px;
  }

  input {
    accent-color: $primary;
  }
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

.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(6, 22, 48, 0.9);
  border: 1px solid $border-color;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  gap: 16px;
  z-index: 20;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $text-secondary;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.online {
        background: $primary;
        box-shadow: 0 0 6px $primary;
      }
      &.warning {
        background: $warning;
        box-shadow: 0 0 6px $warning;
      }
      &.danger {
        background: $danger;
        box-shadow: 0 0 6px $danger;
      }
    }
  }
}
</style>
