import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { AuthErrorCode } from '@cesium-eco/shared'
import router from '@/router'

/** 绝对地址时只取 origin，避免 `.../api/v1` 与追加路径重复成 `/api/v1/api/v1` */
function resolveAdminApiBaseUrl(): string {
  const raw = import.meta.env.VITE_ADMIN_API_BASE
  if (typeof raw !== 'string' || !raw.trim())
    return '/api/v1'
  const s = raw.trim()
  if (!/^https?:\/\//i.test(s))
    return '/api/v1'
  try {
    return `${new URL(s).origin}/api/v1`
  }
  catch {
    return '/api/v1'
  }
}

const baseURL = resolveAdminApiBaseUrl()

export const http = axios.create({
  baseURL,
  timeout: 30_000,
  withCredentials: true,
})

const errorText: Partial<Record<AuthErrorCode, string>> = {
  [AuthErrorCode.USER_NOT_FOUND]: '账号不存在',
  [AuthErrorCode.INVALID_PASSWORD]: '密码错误',
  [AuthErrorCode.ACCOUNT_LOCKED]: '账号已锁定',
  [AuthErrorCode.CAPTCHA_INVALID]: '验证码错误',
  [AuthErrorCode.CAPTCHA_EXPIRED]: '验证码已失效，请刷新',
  [AuthErrorCode.TOO_MANY_ATTEMPTS]: '请求过于频繁，请稍后重试',
  [AuthErrorCode.REFRESH_INVALID]: '登录已失效，请重新登录',
  [AuthErrorCode.TOKEN_EXPIRED]: '登录已失效，请重新登录',
}

function getMessage(err: AxiosError<{ code?: AuthErrorCode; message?: string }>) {
  const code = err.response?.data?.code
  if (code && errorText[code])
    return errorText[code]!
  return err.response?.data?.message || err.message || '请求失败'
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore()
  if (auth.accessToken)
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  return config
})

http.interceptors.response.use(
  (r) => r,
  async (err: AxiosError<{ code?: AuthErrorCode; message?: string }>) => {
    const status = err.response?.status
    const url = err.config?.url ?? ''
    const silent401 = url.includes('/auth/profile')
    if (
      status === 401 &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh') &&
      !silent401
    ) {
      const auth = useAuthStore()
      let retried = false
      if (auth.refreshToken) {
        try {
          await auth.refresh()
          retried = true
        }
        catch {
          /* noop */
        }
      }
      if (retried && err.config) {
        const next = useAuthStore().accessToken
        if (next) {
          err.config.headers.Authorization = `Bearer ${next}`
          return http.request(err.config)
        }
      }
      auth.clear()
      void router.push({ name: 'login' })
    }
    const reqUrl = err.config?.url ?? ''
    if (
      err.config?.skipGlobalError !== true &&
      !reqUrl.includes('auth/login') &&
      !reqUrl.includes('auth/forgot') &&
      !reqUrl.includes('auth/profile') &&
      !reqUrl.includes('auth/captcha')
    )
      ElMessage.error(getMessage(err))

    return Promise.reject(err)
  },
)
