/**
 * 配置工厂：从环境变量读取运行时参数，供 `ConfigService` 注入全应用。
 *
 * 常用变量：
 * - `PORT`：监听端口
 * - `JWT_SECRET` / `JWT_REFRESH_SECRET`：访问令牌与刷新令牌签名密钥
 * - `AUTH_MODE`：`jwt`（默认）或 `session`
 * - `CORS_ORIGIN`：字符串或留空使用默认正则（本地 localhost 任意端口）
 * - `REDIS_URL`：Session 模式下可选，用于 connect-redis
 * - `DATABASE_URL`：Postgres 连接串；空则走 sql.js + admin.sqlite
 * - `SESSION_IDLE_MINUTES`：会话空闲超时（与 main 中 session cookie 一致）
 * - `BCRYPT_ROUNDS`：密码哈希轮数
 */
export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me-in-production',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-change-me',
  /** `jwt`：Bearer Token；`session`：依赖 Cookie Session（见 main.ts） */
  authMode: process.env.AUTH_MODE ?? 'jwt',
  corsOrigin: process.env.CORS_ORIGIN ?? /^http:\/\/localhost:\d+$/,
  redisUrl: process.env.REDIS_URL ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  sessionIdleMinutes: parseInt(process.env.SESSION_IDLE_MINUTES ?? '30', 10),
  bcryptSaltRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
})
