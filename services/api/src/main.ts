/**
 * 应用入口：创建 NestJS 应用、挂载全局中间件与安全策略、配置 CORS、
 * 可选 Session（Redis）、Swagger 文档，并启动 HTTP 监听。
 *
 * 职责概览：
 * - 请求体大小限制、Helmet 安全头、全局路由前缀 `api/v1`
 * - 健康检查与 Prometheus metrics 路径排除在前缀之外
 * - `AUTH_MODE=session` 时启用 express-session，可选 connect-redis 存储
 * - OpenAPI 文档挂载在 `/api/docs`，JSON 在 `/openapi.json`
 */
import 'reflect-metadata' // Nest/TypeORM 装饰器依赖的反射元数据，必须在最早加载
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import Redis from 'ioredis'
import RedisStore from 'connect-redis'
import { ConfigService } from '@nestjs/config'
import { json, urlencoded } from 'express'
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'
import { AppModule } from './app.module'

/**
 * 启动 HTTP 服务：按环境变量装配中间件后监听 `PORT`（默认 4000）。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  // JSON / URL 编码体大小上限，防止过大 payload 压垮进程
  app.use(json({ limit: '2mb' }))
  app.use(urlencoded({ extended: true }))
  app.use(
    helmet({
      // 允许跨域资源策略，便于前端从不同端口加载静态资源
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  // 业务 API 统一前缀；metrics、health 保持根路径便于探针与监控系统访问
  app.setGlobalPrefix('api/v1', {
    exclude: ['metrics', 'health'],
  })

  // CORS：credentials=true 时需明确 origin，默认允许本地任意端口
  const originCfg = config.get<string | RegExp>('corsOrigin')
  const cors: CorsOptions = {
    origin: originCfg as CorsOptions['origin'],
    credentials: true,
  }
  app.enableCors(cors)

  app.use(cookieParser())
  // 全局校验：剔除 DTO 上未声明字段（whitelist），并做类型转换（transform）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  // Session 模式：与 JWT 二选一，由 AUTH_MODE 控制；Redis 可选作集中会话存储
  const redisUrl = config.get<string>('redisUrl') ?? ''
  const mode = (config.get<string>('authMode') ?? 'jwt').toLowerCase()
  if (mode === 'session') {
    const secret = config.get<string>('jwtSecret') ?? 'session-secret'
    const idleMs =
      parseInt(process.env.SESSION_IDLE_MINUTES ?? '30', 10) * 60 * 1000
    let store: session.Store | undefined
    if (redisUrl) {
      const client = new Redis(redisUrl)
      store = new RedisStore({ client, prefix: 'sess:' }) as session.Store
    }
    app.use(
      session({
        store,
        secret,
        resave: false,
        saveUninitialized: false,
        rolling: true, // 每次请求刷新 maxAge，配合 idle 语义
        cookie: {
          maxAge: idleMs,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      }),
    )
  }

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('Cesium Eco Admin API')
    .setDescription('企业后台 OpenAPI')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'Bearer',
    )
    .build()
  const document = SwaggerModule.createDocument(app, swaggerBuilder)
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    jsonDocumentUrl: 'openapi.json',
  })

  const port = config.get<number>('port') ?? 4000
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.info(`Admin API listening on http://localhost:${port}`)
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
