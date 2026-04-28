import 'reflect-metadata'
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(json({ limit: '2mb' }))
  app.use(urlencoded({ extended: true }))
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.setGlobalPrefix('api/v1', {
    exclude: ['metrics', 'health'],
  })

  const originCfg = config.get<string | RegExp>('corsOrigin')
  const cors: CorsOptions = {
    origin: originCfg as CorsOptions['origin'],
    credentials: true,
  }
  app.enableCors(cors)

  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

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
        rolling: true,
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
