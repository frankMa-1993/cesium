<template>
  <div class="editor">
    <div class="palette">
      <div class="hint">从组件库拖拽到画布（DataV 风格占位）</div>
      <div
        v-for="c in components"
        :key="c.type"
        class="chip"
        draggable="true"
        @dragstart="onDragStart(c.type)"
      >
        <el-icon><component :is="c.icon" /></el-icon>
        {{ c.label }}
      </div>
    </div>
    <div
      class="canvas"
      @dragover.prevent
      @drop="onDrop"
    >
      <div v-if="!nodes.length" class="placeholder">拖拽组件到此处布局</div>
      <div
        v-for="(n, i) in nodes"
        :key="i"
        class="node"
        :style="{ top: n.y + 'px', left: n.x + 'px' }"
      >
        <el-tag closable @close="nodes.splice(i, 1)">{{ n.type }}</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  TrendCharts,
  Grid,
  MapLocation,
  Document,
  Picture,
} from '@element-plus/icons-vue'

const dragging = ref<string | null>(null)
const nodes = ref<{ type: string; x: number; y: number }[]>([])

const components = [
  { type: 'chart', label: '图表', icon: TrendCharts },
  { type: 'table', label: '表格', icon: Grid },
  { type: 'map', label: '地图', icon: MapLocation },
  { type: 'text', label: '文本', icon: Document },
  { type: 'media', label: '媒体', icon: Picture },
]

function onDragStart(t: string) {
  dragging.value = t
}

function onDrop(ev: DragEvent) {
  const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  const t = dragging.value
  if (!t)
    return
  nodes.value.push({
    type: t,
    x: ev.clientX - rect.left - 40,
    y: ev.clientY - rect.top - 16,
  })
  dragging.value = null
}
</script>

<style scoped lang="scss">
.editor {
  display: flex;
  gap: 16px;
  min-height: 360px;
}
.palette {
  width: 200px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 12px;
}
.hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: grab;
}
.canvas {
  flex: 1;
  position: relative;
  background: #0b1220;
  border-radius: 8px;
  min-height: 360px;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}
.node {
  position: absolute;
}
</style>
