<template>
  <div class="stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :style="valueStyle">
      <span class="num">{{ animatedValue }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>
    <div v-if="trend !== undefined" class="stat-trend" :class="trend >= 0 ? 'up' : 'down'">
      {{ trend >= 0 ? '▲' : '▼' }} {{ Math.abs(trend) }}%
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  label: String,
  value: Number,
  unit: String,
  color: { type: String, default: '#00f0ff' },
  trend: Number,
})

const animatedValue = ref(0)

watch(
  () => props.value,
  (newVal) => {
    const start = animatedValue.value
    const end = newVal || 0
    const duration = 800
    const startTime = performance.now()

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      animatedValue.value = Math.floor(start + (end - start) * ease)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  },
  { immediate: true }
)

const valueStyle = computed(() => ({
  color: props.color,
  textShadow: `0 0 12px ${props.color}66`,
}))
</script>

<style scoped lang="scss">
@use "@/styles/vars.scss" as *;

.stat-card {
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.12);
  border-radius: 4px;
  padding: 12px;
  text-align: center;

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 8px;
  }

  .stat-value {
    font-family: 'DIN Alternate', 'DIN', 'Impact', sans-serif;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;

    .unit {
      font-size: 12px;
      font-weight: 400;
      margin-left: 4px;
      opacity: 0.7;
    }
  }

  .stat-trend {
    font-size: 11px;
    margin-top: 6px;

    &.up {
      color: $success;
    }
    &.down {
      color: $danger;
    }
  }
}
</style>
