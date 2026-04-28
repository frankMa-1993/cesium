export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me-in-production',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-change-me',
  /** JWT=true-ish ⇒ SESSION_STORE_DISABLED-ish ⇒ Prefer Jwt bearer **/
  authMode: process.env.AUTH_MODE ?? 'jwt',
  corsOrigin: process.env.CORS_ORIGIN ?? /^http:\/\/localhost:\d+$/,
  redisUrl: process.env.REDIS_URL ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  sessionIdleMinutes: parseInt(process.env.SESSION_IDLE_MINUTES ?? '30', 10),
  bcryptSaltRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
})
