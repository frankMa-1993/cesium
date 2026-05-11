/// <reference types="vite/client" />

export {}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 为 true 时不弹出全局 ElMessage（由调用方自行处理） */
    skipGlobalError?: boolean
  }
}

interface ImportMetaEnv {
  readonly VITE_DASHBOARD_PUBLIC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
