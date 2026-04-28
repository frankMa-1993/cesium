/**
 * 根模块：集中注册全局配置、数据库（TypeORM）、Prometheus 指标与各业务子模块。
 *
 * 数据库策略：
 * - 若 `DATABASE_URL` 为 postgres，则使用 PostgreSQL；非生产默认 synchronize
 * - 否则使用 sql.js，持久化文件为 `data/admin.sqlite`（测试或 TYPEORM_DATABASE=:memory: 时用内存库）
 */
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import configuration from './config/configuration'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { DictModule } from './dict/dict.module'
import { AuditModule } from './audit/audit.module'
import { ScreenModule } from './screen/screen.module'
import { SystemModule } from './system/system.module'
import { RolesModule } from './roles/roles.module'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { HealthController } from './health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('databaseUrl')
        const env = config.get<string>('env')
        const isMemory =
          env === 'test' || process.env.TYPEORM_DATABASE === ':memory:'
        if (url && url.startsWith('postgres')) {
          return {
            type: 'postgres' as const,
            url,
            autoLoadEntities: true,
            synchronize: env !== 'production',
          }
        }
        const dbFile = join(process.cwd(), 'data', 'admin.sqlite')
        if (!isMemory)
          mkdirSync(dirname(dbFile), { recursive: true })
        return {
          type: 'sqljs' as const,
          autoSave: !isMemory,
          location: isMemory ? undefined : dbFile,
          autoLoadEntities: true,
          synchronize: true,
        }
      },
    }),
    PrometheusModule.register({
      path: 'metrics',
    }),
    AuthModule,
    UsersModule,
    DictModule,
    AuditModule,
    ScreenModule,
    SystemModule,
    RolesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
