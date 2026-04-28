/**
 * 企业后台域 — 与 services/api、apps/admin 共用类型
 */

/** 登录/业务错误码（后端与前端文案一一对应） */
export enum AuthErrorCode {
  OK = 0,
  USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  INVALID_PASSWORD = 'AUTH_INVALID_PASSWORD',
  ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  CAPTCHA_INVALID = 'AUTH_CAPTCHA_INVALID',
  CAPTCHA_EXPIRED = 'AUTH_CAPTCHA_EXPIRED',
  TOO_MANY_ATTEMPTS = 'AUTH_TOO_MANY_ATTEMPTS',
  REFRESH_INVALID = 'AUTH_REFRESH_INVALID',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  FORBIDDEN = 'AUTH_FORBIDDEN',
}

export type UserStatus = 'enabled' | 'disabled'

export interface AuthUser {
  id: string
  username: string
  phone?: string | null
  displayName: string
  deptId?: string | null
  status: UserStatus
}

export interface MenuItem {
  path: string
  name: string
  title: string
  icon?: string
  children?: MenuItem[]
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

export interface LoginAuditFields {
  userId: string | null
  ip: string
  province?: string | null
  city?: string | null
  userAgent: string
  success: boolean
  failReason?: string | null
  sessionId: string
  at: string
}

export type DictChangeType = 'added' | 'modified' | 'removed'

export interface DictItemDiffRow {
  key: string
  label?: string
  value?: string
  change: DictChangeType
}

export type ScreenDatasourceType = 'STATIC_JSON' | 'REST' | 'WEBSOCKET' | 'MQTT'

export interface ScreenDatasourceConfig {
  id: string
  name: string
  type: ScreenDatasourceType
  /** 根据 type 解析：URL、轮询间隔、鉴权、Topic 等 */
  config: Record<string, unknown>
  updatedAt: string
}
