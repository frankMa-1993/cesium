<template>
  <div class="video-monitor">
    <div class="toolbar">
      <div class="toolbar-row">
        <h2 class="page-title">视频监控</h2>
        <span class="hint">每路按优先级尝试：<strong>FLV（flv.js）</strong> → <strong>HLS（hls.js）</strong> → <strong>RTMP</strong>（浏览器通常不可播，将提示转封装）</span>
      </div>
      <p v-if="apiError" class="api-err">{{ apiError }}</p>
    </div>
    <div class="grid">
      <VideoStreamCell
        v-for="i in 4"
        :key="cellKey(i - 1)"
        :preset="cells[i - 1] ?? null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { ElButton, ElNotification } from 'element-plus'
import { http } from '@/utils/request'
import VideoStreamCell from '@/components/video/VideoStreamCell.vue'

const cells = ref([null, null, null, null])
const apiError = ref('')

function cellKey(index) {
  const p = cells.value[index]
  return `${index}-${p?.id ?? 'empty'}`
}

function notifyServiceDown(retry) {
  let handle
  handle = ElNotification({
    title: '服务暂不可用',
    type: 'error',
    duration: 0,
    message: h('div', { class: 'api-down-toast' }, [
      h('p', { style: 'margin:0 0 10px;line-height:1.55' }, '获取预设视频流超时或接口异常，请稍后重试'),
      h(
        ElButton,
        {
          type: 'primary',
          size: 'small',
          onClick: () => {
            retry()
            handle?.close()
          },
        },
        () => '重新加载',
      ),
    ]),
  })
}

async function loadPresets() {
  apiError.value = ''
  try {
    const { data } = await http.get('/monitor/video-presets', {
      timeout: 3000,
      skipGlobalError: true,
    })
    const items = data.items ?? []
    cells.value = [0, 1, 2, 3].map((i) => items[i] ?? null)
  }
  catch {
    cells.value = [null, null, null, null]
    apiError.value = '预设视频流加载失败（3 秒超时或服务器异常）。'
    notifyServiceDown(() => loadPresets())
  }
}

onMounted(() => {
  loadPresets()
})
</script>

<style scoped lang="scss">
.video-monitor {
  padding: 0 4px 16px;
}
.toolbar {
  margin-bottom: 16px;
}
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0b1220;
}
.hint {
  font-size: 13px;
  color: #5c6b7a;
  line-height: 1.5;
  max-width: 720px;
}
.api-err {
  margin: 10px 0 0;
  color: #c0392b;
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
