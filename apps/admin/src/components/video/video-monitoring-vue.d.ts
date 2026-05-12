/**
 * 视频监控相关 SFC 为纯 JS `<script setup>`，为满足 vue-tsc + strict 下自其它 .ts 文件的动态导入，在此补充模块声明。
 */
declare module '@/views/VideoMonitor.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '@/components/video/VideoStreamCell.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
