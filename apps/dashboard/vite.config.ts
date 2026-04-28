import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import mockPlugin from './src/mock/vite-plugin-mock'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const repoRoot = resolve(__dirname, '../..')
  const env = { ...loadEnv(mode, repoRoot, ''), ...loadEnv(mode, process.cwd(), '') }

  return {
    base: './',
    plugins: [
      vue(),
      cesium({
        rebuildCesium: false,
      }),
      mockPlugin(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@cesium-eco/core': resolve(__dirname, '../../packages/core/src/index.ts'),
        /* 与 core 一致：开发时使用源码，避免 dist 滞后导致 Dashboard 等页面样式未更新 */
        '@cesium-eco/app': resolve(__dirname, '../../packages/app/src/index.ts'),
        '@cesium-eco/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@cesium-eco/shared/styles/vars.scss" as *;`,
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('cesium')) return 'cesium'
            if (id.includes('@cesium-eco')) return 'eco'
          },
        },
      },
    },
    define: {
      __TIANDITU_TOKEN__: JSON.stringify(env.VITE_TIANDITU_TOKEN || ''),
    },
  }
})
