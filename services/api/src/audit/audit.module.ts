/**
 * 审计模块：登录日志查询（与 `AuthService.audit` 写入同一张表）。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoginLogEntity } from '../entities/login-log.entity'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([LoginLogEntity])],
  providers: [AuditService, PermissionsGuard],
  controllers: [AuditController],
})
export class AuditModule {}
