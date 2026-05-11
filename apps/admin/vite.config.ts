import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

function devProxyOrigin(raw: string | undefined): string {
  const fallback = 'http://localhost:4000'
  const s = (raw ?? '').trim()
  if (!s)
    return fallback
  if (!/^https?:\/\//i.test(s))
    return fallback
  try {
    return new URL(s).origin
  }
  catch {
    return fallback
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = devProxyOrigin(env.VITE_ADMIN_API_BASE)
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
