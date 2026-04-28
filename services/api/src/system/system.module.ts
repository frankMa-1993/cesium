/**
 * 系统模块：动态菜单（按权限过滤）与数据库种子（默认管理员、演示字典）。
 */
import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { MenusController } from './menus.controller'
import { SeedService } from './seed.service'

@Module({
  imports: [AuthModule],
  providers: [SeedService],
  controllers: [MenusController],
})
export class SystemModule {}
