import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'
import mockPlugin from './src/mock/vite-plugin-mock.js'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

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
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/vars.scss" as *;`,
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
          },
        },
      },
    },
    define: {
      __TIANDITU_TOKEN__: JSON.stringify(env.VITE_TIANDITU_TOKEN || ''),
    },
  }
})
