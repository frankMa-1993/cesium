/**
 * 扩展 express-session 的 SessionData，使 TypeScript 识别登录后写入的自定义字段。
 * 这些字段在 `AUTH_MODE=session` 时由 `AuthController.login` 赋值，
 * `HybridAuthGuard` 再读出构造 `req.user`。
 */
import 'express-session'

declare module 'express-session' {
  interface SessionData {
    /** 当前登录用户主键（UUID） */
    userId?: string
    /** 登录名，用于展示或审计 */
    username?: string
    /** 由角色聚合得到的权限码列表，与 JWT 内 permissions 语义一致 */
    permissions?: string[]
  }
}
