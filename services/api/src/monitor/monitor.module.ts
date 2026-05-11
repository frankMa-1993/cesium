/**
 * 视频监控模块：预设拉流地址等只读接口。
 */
import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { MonitorController } from './monitor.controller'

@Module({
  imports: [AuthModule],
  providers: [PermissionsGuard],
  controllers: [MonitorController],
})
export class MonitorModule {}
