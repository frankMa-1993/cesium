import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_ADMIN_API_BASE || 'http://localhost:4000'
  return {
    base: './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5176,
      open: true,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
        },
      },
    },
  }
})
