<template>
  <div class="screen-container">
    <!-- 顶部标题栏 -->
    <header class="screen-header">
      <div class="header-bg">
        <h1 class="header-title">🌍 全域生态环境监测大屏</h1>
        <div class="header-time">{{ currentTime }}</div>
      </div>
    </header>

    <!-- 主体内容 -->
    <div class="screen-body">
      <!-- 左侧面板 -->
      <aside class="panel-left">
        <div class="data-panel">
          <div class="panel-title">设备概览</div>
          <div class="stats-grid">
            <StatCard
              label="设备在线数"
              :value="overview.onlineDevices"
              unit="台"
              color="#00f0ff"
            />
            <StatCard
              label="设备总数"
              :value="overview.totalDevices"
              unit="台"
              color="#007aff"
            />
            <StatCard
              label="在线率"
              :value="overview.onlineRate"
              unit="%"
              color="#52c41a"
            />
            <StatCard
              label="今日任务"
              :value="overview.todayTask"
              unit="项"
              color="#ff9c00"
            />
          </div>
        </div>

        <div class="data-panel">
          <div class="panel-title">实时告警</div>
          <div class="alert-list">
            <div
              v-for="item in alerts"
              :key="item.id"
              class="alert-item"
              :class="item.level"
            >
              <div class="alert-tag">{{ item.type }}</div>
              <div class="alert-info">
                <span class="alert-device">{{ item.deviceName }}</span>
                <span class="alert-area">{{ item.area }}</span>
              </div>
              <div class="alert-time">{{ item.time.split(' ')[1] }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央地图 -->
      <main class="panel-center">
        <MapViewer />
      </main>

      <!-- 右侧面板 -->
      <aside class="panel-right">
        <div class="data-panel">
          <div class="panel-title">告警统计</div>
          <div class="stats-grid cols-2">
            <StatCard
              label="严重告警"
              :value="overview.alertCount"
              unit="条"
              color="#ff4d4f"
            />
            <StatCard
              label="一般预警"
              :value="overview.warningCount"
              unit="条"
              color="#ff9c00"
            />
          </div>
        </div>

        <div class="data-panel">
          <div class="panel-title">在线趋势</div>
          <TrendChart
            :data="trend.onlineTrend"
            :labels="trend.hours"
            :width="260"
            :height="100"
          />
        </div>

        <div class="data-panel">
          <div class="panel-title">告警趋势</div>
          <TrendChart
            :data="trend.alertTrend"
            :labels="trend.hours"
            :width="260"
            :height="100"
            color="#ff4d4f"
          />
        </div>

        <div class="data-panel">
          <div class="panel-title">任务进度</div>
          <div class="task-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: taskProgress + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              已完成 {{ overview.completedTask }} / {{ overview.todayTask }}
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import MapViewer from '@/components/MapViewer.vue'
import StatCard from '@/components/StatCard.vue'
import TrendChart from '@/components/TrendChart.vue'
import { fetchOverview, fetchAlerts, fetchTrend } from '@/api/index.js'

const currentTime = ref('')
let timer = null
let pollTimer = null

const overview = ref({
  onlineDevices: 0,
  totalDevices: 2000,
  alertCount: 0,
  warningCount: 0,
  todayTask: 0,
  completedTask: 0,
  onlineRate: 0,
})

const alerts = ref([])
const trend = ref({
  hours: [],
  onlineTrend: [],
  alertTrend: [],
  dataVolume: [],
})

const taskProgress = computed(() => {
  const total = overview.value.todayTask || 1
  return Math.min(((overview.value.completedTask || 0) / total) * 100, 100)
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function loadData() { // 加载数据
  try {
    const [oRes, aRes, tRes] = await Promise.all([
      fetchOverview(), // 获取概览数据
      fetchAlerts(), // 获取告警数据
      fetchTrend(), // 获取趋势数据
    ])

    if (oRes.code === 200) overview.value = oRes.data
    if (aRes.code === 200) alerts.value = aRes.data.list
    if (tRes.code === 200) trend.value = tRes.data
  } catch (e) {
    console.error('数据加载失败', e)
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadData()
//   pollTimer = setInterval(loadData, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
//   clearInterval(pollTimer)
})
</script>

<style scoped lang="scss">
@use "@/styles/vars.scss" as *;

.screen-header {
  height: $header-height;
  flex-shrink: 0;
  position: relative;
  z-index: 10;

  .header-bg {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(0,240,255,0.12) 0%, transparent 100%);
    border-bottom: 1px solid $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      width: 30%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $primary, transparent);
    }
    &::before { left: 0; }
    &::after { right: 0; }
  }

  .header-title {
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 4px;
    text-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  }

  .header-time {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: $text-secondary;
    font-family: 'DIN Alternate', monospace;
  }

}

.screen-body {
  flex: 1;
  display: grid;
  grid-template-columns: $panel-width 1fr $panel-width;
  gap: 12px;
  padding: 12px;
  min-height: 0;
}

.panel-left,
.panel-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;

  .data-panel {
    flex-shrink: 0;
  }
}

.panel-center {
  min-height: 0;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid $border-color;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  &.cols-2 {
    grid-template-columns: 1fr 1fr;
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  font-size: 12px;
  border-left: 3px solid transparent;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &.danger {
    border-left-color: $danger;
    .alert-tag { background: rgba($danger, 0.15); color: $danger; }
  }
  &.warning {
    border-left-color: $warning;
    .alert-tag { background: rgba($warning, 0.15); color: $warning; }
  }
  &.info {
    border-left-color: $secondary;
    .alert-tag { background: rgba($secondary, 0.15); color: $secondary; }
  }

  .alert-tag {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    white-space: nowrap;
  }

  .alert-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .alert-device {
      color: $text-primary;
      font-weight: 500;
    }
    .alert-area {
      color: $text-muted;
      font-size: 11px;
    }
  }

  .alert-time {
    color: $text-muted;
    font-size: 11px;
    white-space: nowrap;
  }
}

.task-progress {
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $secondary, $primary);
    border-radius: 4px;
    transition: width 0.6s ease;
  }
  .progress-text {
    font-size: 12px;
    color: $text-secondary;
    text-align: right;
  }
}

// 响应式：小屏时堆叠
@media (max-width: 1200px) {
  .screen-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  .panel-left,
  .panel-right {
    flex-direction: row;
    flex-wrap: wrap;
    overflow-x: auto;
    .data-panel {
      min-width: 240px;
      flex: 1;
    }
  }
}
</style>
