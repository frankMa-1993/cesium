<template>
  <div ref="wrapRef" class="cell-wrap">
    <div class="cell-head">
      <span class="title">{{ preset?.title ?? '空闲窗口' }}</span>
      <span v-if="activeLabel" class="proto">{{ activeLabel }}</span>
    </div>
    <div class="cell-body">
      <video
        ref="videoRef"
        class="video"
        playsinline
        @play="playing = true"
        @pause="playing = false"
        @error="onVideoError"
      />
      <div v-if="!preset" class="overlay">无预设信号</div>
    </div>
    <div v-if="preset" class="cell-actions">
      <el-button-group size="small">
        <el-button :icon="playing ? VideoPause : VideoPlay" @click="togglePlay" />
        <el-button :icon="muted ? Mute : Bell" @click="toggleMute" />
        <el-button :icon="FullScreen" @click="toggleFullscreen" />
      </el-button-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { h } from 'vue'
import { ElButton, ElNotification } from 'element-plus'
import { VideoPlay, VideoPause, Mute, Bell, FullScreen } from '@element-plus/icons-vue'
import flvjs from 'flv.js'
import Hls from 'hls.js'

const props = defineProps({
  preset: {
    type: Object,
    default: null,
  },
})

const wrapRef = ref(null)
const videoRef = ref(null)
const playing = ref(false)
const muted = ref(false)
const activeLabel = ref('')

let flvPlayer = null
let hlsPlayer = null
let playSession = 0

function notifyStreamError(message, retry) {
  let handle
  handle = ElNotification({
    title: '播放异常',
    type: 'error',
    duration: 0,
    message: h('div', { class: 'stream-err-toast' }, [
      h('p', { style: 'margin:0 0 10px;line-height:1.55' }, message),
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

function destroyPlayers() {
  if (hlsPlayer) {
    hlsPlayer.destroy()
    hlsPlayer = null
  }
  if (flvPlayer) {
    try {
      flvPlayer.pause()
      flvPlayer.unload()
      flvPlayer.detachMediaElement()
      flvPlayer.destroy()
    }
    catch {
      /* noop */
    }
    flvPlayer = null
  }
  const v = videoRef.value
  if (v) {
    v.removeAttribute('src')
    v.load()
  }
  activeLabel.value = ''
}

function onVideoError() {
  notifyStreamError('视频解码失败或媒体资源异常', () => reloadSlot())
}

function onOffline() {
  notifyStreamError('网络已断开，请检查连接后重试', () => reloadSlot())
}

async function tryFlv(url, session) {
  const v = videoRef.value
  if (!v || !flvjs.isSupported() || session !== playSession)
    return false
  const player = flvjs.createPlayer(
    { type: 'flv', url, isLive: false },
    { enableWorker: false, stashInitialSize: 128 },
  )
  flvPlayer = player
  player.attachMediaElement(v)
  let mediaInfoReceived = false
  return new Promise((resolve) => {
    let done = false
    const finish = (ok) => {
      if (done || session !== playSession)
        return
      done = true
      window.clearTimeout(tid)
      if (!ok) {
        destroyPlayers()
        resolve(false)
        return
      }
      try {
        player.pause()
      }
      catch {
        /* noop */
      }
      v.pause()
      resolve(true)
    }
    function onMediaInfo() {
      if (done || session !== playSession)
        return
      mediaInfoReceived = true
      finish(true)
    }
    const tid = window.setTimeout(() => {
      if (!done && session === playSession)
        finish(false)
    }, 20_000)
    player.on(flvjs.Events.MEDIA_INFO, onMediaInfo)
    player.on(flvjs.Events.ERROR, () => {
      if (session !== playSession || done)
        return
      if (mediaInfoReceived) {
        notifyStreamError('FLV 码流异常或解码失败', () => reloadSlot())
      }
      else {
        finish(false)
      }
    })
    try {
      player.load()
    }
    catch {
      finish(false)
    }
  })
}

async function tryHls(url, session) {
  const v = videoRef.value
  if (!v || session !== playSession)
    return false
  if (Hls.isSupported()) {
    const hls = new Hls({ enableWorker: true })
    hlsPlayer = hls
    let manifestParsed = false
    return new Promise((resolve) => {
      let done = false
      const finish = (ok) => {
        if (done || session !== playSession)
          return
        done = true
        window.clearTimeout(tid)
        if (!ok) {
          destroyPlayers()
          resolve(false)
          return
        }
        v.pause()
        resolve(true)
      }
      function onManifestParsed() {
        if (done || session !== playSession)
          return
        manifestParsed = true
        finish(true)
      }
      const tid = window.setTimeout(() => {
        if (!done && session === playSession)
          finish(false)
      }, 20_000)
      hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed)
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (session !== playSession || done || !data.fatal)
          return
        if (manifestParsed) {
          notifyStreamError(`HLS 异常：${data.type} / ${data.details}`, () =>
            reloadSlot(),
          )
        }
        else {
          finish(false)
        }
      })
      hls.loadSource(url)
      hls.attachMedia(v)
    })
  }
  if (v.canPlayType('application/vnd.apple.mpegurl')) {
    activeLabel.value = 'HLS(原生)'
    return new Promise((resolve) => {
      let done = false
      const finish = (ok) => {
        if (done || session !== playSession)
          return
        done = true
        v.removeEventListener('loadedmetadata', onMeta)
        window.clearTimeout(tid)
        if (!ok) {
          destroyPlayers()
          resolve(false)
          return
        }
        v.pause()
        resolve(true)
      }
      function onMeta() {
        finish(true)
      }
      const tid = window.setTimeout(() => {
        if (!done && session === playSession)
          finish(false)
      }, 20_000)
      v.addEventListener('loadedmetadata', onMeta)
      v.src = url
    })
  }
  return false
}

async function tryProtocols(session) {
  const preset = props.preset
  const v = videoRef.value
  if (!preset || !v) {
    destroyPlayers()
    return
  }
  destroyPlayers()
  if (session !== playSession)
    return

  if (preset.flvUrl && flvjs.isSupported()) {
    activeLabel.value = 'FLV'
    const ok = await tryFlv(preset.flvUrl, session)
    if (ok && session === playSession)
      return
  }

  if (session !== playSession)
    return
  if (preset.hlsUrl) {
    activeLabel.value = 'HLS'
    const ok = await tryHls(preset.hlsUrl, session)
    if (ok && session === playSession)
      return
  }

  if (session !== playSession)
    return
  if (preset.rtmpUrl) {
    activeLabel.value = 'RTMP'
    notifyStreamError(
      '浏览器无法直接播放 RTMP，请将流转封装为 HTTP-FLV 或 HLS',
      () => reloadSlot(),
    )
    return
  }
  notifyStreamError('FLV / HLS 均不可用，请检查地址或跨域配置', () =>
    reloadSlot(),
  )
}

function reloadSlot() {
  playSession += 1
  const session = playSession
  nextTick(async () => {
    destroyPlayers()
    if (!props.preset || !videoRef.value) {
      playing.value = false
      return
    }
    const el = videoRef.value
    el.muted = muted.value
    await tryProtocols(session)
    if (videoRef.value) {
      videoRef.value.pause()
      playing.value = false
    }
  })
}

watch(
  () => props.preset,
  () => reloadSlot(),
  { deep: true, immediate: true },
)

onMounted(() => {
  window.addEventListener('offline', onOffline)
})

onUnmounted(() => {
  window.removeEventListener('offline', onOffline)
  playSession += 1
  destroyPlayers()
})

function togglePlay() {
  const v = videoRef.value
  if (!v || !props.preset)
    return
  if (v.paused)
    v.play()
  else v.pause()
}

function toggleMute() {
  const v = videoRef.value
  if (!v)
    return
  v.muted = !v.muted
  muted.value = v.muted
}

function toggleFullscreen() {
  const el = wrapRef.value
  if (!el)
    return
  if (document.fullscreenElement)
    document.exitFullscreen()
  else if (typeof el.requestFullscreen === 'function')
    el.requestFullscreen()
  else if (typeof el.webkitRequestFullscreen === 'function')
    el.webkitRequestFullscreen()
}
</script>

<style scoped lang="scss">
.cell-wrap {
  display: flex;
  flex-direction: column;
  background: #0b1220;
  border: 1px solid #1c2a3f;
  border-radius: 8px;
  overflow: hidden;
  min-height: 220px;
}
.cell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: #060b14;
  color: #b8c5d6;
  font-size: 13px;
}
.title {
  font-weight: 600;
  color: #e8eef7;
}
.proto {
  font-size: 11px;
  opacity: 0.85;
  color: #64b5f6;
}
.cell-body {
  position: relative;
  flex: 1;
  min-height: 160px;
  background: #000;
}
.video {
  width: 100%;
  height: 100%;
  min-height: 160px;
  object-fit: contain;
  vertical-align: middle;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7c90;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.35);
}
.cell-actions {
  padding: 8px 10px;
  background: #060b14;
  display: flex;
  justify-content: flex-end;
}
</style>
