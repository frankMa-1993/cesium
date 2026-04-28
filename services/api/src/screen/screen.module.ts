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
