import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../entities/user.entity'
import { RoleEntity } from '../entities/role.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([UserEntity, RoleEntity])],
  providers: [UsersService, PermissionsGuard],
  controllers: [UsersController],
})
export class UsersModule {}
