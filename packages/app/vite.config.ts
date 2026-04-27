import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@cesium-eco/app',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/node_modules/, /^vue/, /^vue-router/, /^pinia/, /^cesium/, /^@cesium-eco/],
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@cesium-eco/shared/styles/vars.scss" as *;`,
      },
    },
  },
})
