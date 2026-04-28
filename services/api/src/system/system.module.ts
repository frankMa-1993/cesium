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
