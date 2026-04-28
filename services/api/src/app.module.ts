import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'path'
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
        return {
          type: 'better-sqlite3' as const,
          database: isMemory
            ? ':memory:'
            : join(process.cwd(), 'data', 'admin.sqlite'),
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
