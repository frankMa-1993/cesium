<template>
  <div class="trend-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <g class="grid">
        <line
          v-for="i in 5"
          :key="'h' + i"
          :x1="0"
          :y1="((height || 120) / 5) * i"
          :x2="width || 300"
          :y2="((height || 120) / 5) * i"
          stroke="rgba(0,240,255,0.1)"
          stroke-width="1"
        />
      </g>

      <polyline
        :points="linePoints"
        fill="none"
        :stroke="color || '#00f0ff'"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <polygon
        :points="areaPoints"
        :fill="(color || '#00f0ff') + '26'"
      />

      <circle
        v-for="(p, i) in points"
        :key="i"
        :cx="p.x"
        :cy="p.y"
        r="3"
        :fill="color || '#00f0ff'"
        stroke="#fff"
        stroke-width="1"
      />
    </svg>

    <div class="x-labels">
      <span
        v-for="(label, i) in xLabels"
        :key="i"
        :style="{ left: `${(i / (xLabels.length - 1)) * 100}%` }"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: number[]
  labels: string[]
  width?: number
  height?: number
  color?: string
}>()

const padding = 10

const xLabels = computed(() => {
  const step = Math.ceil(props.labels.length / 6)
  return props.labels.filter((_, i) => i % step === 0)
})

const points = computed(() => {
  const data = props.data.length ? props.data : [0]
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = props.width || 300
  const h = props.height || 120

  return data.map((val, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * ((props.width || 300) - padding * 2)
    const y = h - padding - ((val - min) / range) * (h - padding * 2)
    return { x, y, val }
  })
})

const linePoints = computed(() => {
  return points.value.map((p) => `${p.x},${p.y}`).join(' ')
})

const areaPoints = computed(() => {
  const pts = points.value
  if (!pts.length) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  const h = props.height || 120
  return `${first.x},${h} ${linePoints.value} ${last.x},${h}`
})
</script>

<style scoped lang="scss">
@use "@cesium-eco/shared/styles/vars.scss" as *;

.trend-chart {
  position: relative;
  width: 100%;
  height: 140px;

  svg {
    width: 100%;
    height: 100%;
  }

  .x-labels {
    position: relative;
    height: 20px;
    margin-top: 4px;

    span {
      position: absolute;
      transform: translateX(-50%);
      font-size: 10px;
      color: $text-muted;
      white-space: nowrap;
    }
  }
}
</style>
