import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '@/utils/request'
import type { MenuItem } from '@cesium-eco/shared'
import { decodeJwtPayload } from '@/utils/jwt'

function loadPermsFromStorage(): string[] {
  try {
    return JSON.parse(localStorage.getItem('admin_perm') ?? '[]') as string[]
  }
  catch {
    return []
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('admin_access'))
  const refreshToken = ref<string | null>(localStorage.getItem('admin_refresh'))
  const permissions = ref<string[]>(loadPermsFromStorage())
  const menus = ref<MenuItem[]>([])
  const username = ref<string>('')

  const isLoggedIn = computed(
    () => !!accessToken.value || permissions.value.length > 0,
  )

  function setPermissions(perms: string[]) {
    permissions.value = perms
    localStorage.setItem('admin_perm', JSON.stringify(perms))
  }

  function persistTokens(at: string | null, rt: string | null) {
    accessToken.value = at
    refreshToken.value = rt
    if (at)
      localStorage.setItem('admin_access', at)
    else localStorage.removeItem('admin_access')
    if (rt)
      localStorage.setItem('admin_refresh', rt)
    else localStorage.removeItem('admin_refresh')
  }

  async function login(payload: {
    identifier: string
    password: string
    captchaId: string
    captchaText: string
  }) {
    const { data } = await http.post<{
      accessToken?: string
      refreshToken?: string
      expiresIn?: number
      user: { username: string; id: string }
      permissions?: string[]
    }>('/auth/login', payload)
    if (data.accessToken && data.refreshToken) {
      persistTokens(data.accessToken, data.refreshToken)
    }
    username.value = data.user.username
    setPermissions(data.permissions ?? [])
    await fetchMenus()
  }

  async function fetchMenus() {
    const { data } = await http.get<{ items: MenuItem[] }>('/system/menus')
    menus.value = data.items ?? []
  }

  async function refresh(): Promise<void> {
    const rt = refreshToken.value ?? localStorage.getItem('admin_refresh')
    if (!rt)
      throw new Error('no refresh')
    const { data } = await http.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken: rt },
    )
    persistTokens(data.accessToken, data.refreshToken)
    const pl = decodeJwtPayload<{ permissions?: string[] }>(data.accessToken)
    if (pl?.permissions)
      setPermissions(pl.permissions)
  }

  async function logout() {
    try {
      await http.post('/auth/logout', {})
    }
    catch {
      /* ignore */
    }
    clear()
  }

  function clear() {
    persistTokens(null, null)
    permissions.value = []
    localStorage.removeItem('admin_perm')
    menus.value = []
    username.value = ''
  }

  async function bootstrap() {
    try {
      const { data } = await http.get<{
        permissions: string[]
        username: string
      }>('/auth/profile')
      setPermissions(data.permissions)
      username.value = data.username
      await fetchMenus()
      return
    }
    catch {
      /* 无 Session / 未携带 Token 时继续尝试 JWT */
    }
    if (!accessToken.value) {
      clear()
      return
    }
    try {
      const pl = decodeJwtPayload<{ username?: string; permissions?: string[] }>(
        accessToken.value,
      )
      if (pl?.permissions?.length)
        setPermissions(pl.permissions)
      if (pl?.username)
        username.value = pl.username
      await fetchMenus()
    }
    catch {
      clear()
    }
  }

  return {
    accessToken,
    refreshToken,
    permissions,
    menus,
    username,
    isLoggedIn,
    login,
    fetchMenus,
    refresh,
    logout,
    clear,
    bootstrap,
    persistTokens,
    setPermissions,
  }
})
