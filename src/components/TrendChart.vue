<template>
  <div class="trend-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <!-- 网格线 -->
      <g class="grid">
        <line
          v-for="i in 5"
          :key="'h' + i"
          :x1="0"
          :y1="(height / 5) * i"
          :x2="width"
          :y2="(height / 5) * i"
          stroke="rgba(0,240,255,0.1)"
          stroke-width="1"
        />
      </g>

      <!-- 折线 -->
      <polyline
        :points="linePoints"
        fill="none"
        stroke="#00f0ff"
        stroke-width="2"
        stroke-linejoin="round"
      />

      <!-- 面积 -->
      <polygon
        :points="areaPoints"
        fill="rgba(0,240,255,0.15)"
      />

      <!-- 数据点 -->
      <circle
        v-for="(p, i) in points"
        :key="i"
        :cx="p.x"
        :cy="p.y"
        r="3"
        fill="#00f0ff"
        stroke="#fff"
        stroke-width="1"
      />
    </svg>

    <!-- X 轴标签 -->
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

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 120 },
})

const padding = 10

const xLabels = computed(() => {
  // 只展示部分标签避免重叠
  const step = Math.ceil(props.labels.length / 6)
  return props.labels.filter((_, i) => i % step === 0)
})

const points = computed(() => {
  const data = props.data.length ? props.data : [0]
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  return data.map((val, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (props.width - padding * 2)
    const y = props.height - padding - ((val - min) / range) * (props.height - padding * 2)
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
  return `${first.x},${props.height} ${linePoints.value} ${last.x},${props.height}`
})
</script>

<style scoped lang="scss">
@use "@/styles/vars.scss" as *;

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
