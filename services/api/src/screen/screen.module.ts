/**
 * 大屏数据源模块：管理可视化大屏后端连接配置（静态 JSON、REST、WebSocket、MQTT 等类型的元数据）。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScreenDatasourceEntity } from '../entities/screen-datasource.entity'
import { ScreenService } from './screen.service'
import { ScreenController } from './screen.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ScreenDatasourceEntity])],
  providers: [ScreenService, PermissionsGuard],
  controllers: [ScreenController],
})
export class ScreenModule {}
