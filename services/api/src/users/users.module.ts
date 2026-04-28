/**
 * 用户管理模块：分页列表、批量启停、批量重置密码、角色分配、CSV 导出。
 * 依赖 `AuthModule` 以使用 `HybridAuthGuard` 与 JWT 能力。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeptEntity } from '../entities/dept.entity'
import { UserEntity } from '../entities/user.entity'
import { RoleEntity } from '../entities/role.entity'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([UserEntity, RoleEntity, DeptEntity]),
  ],
  providers: [UsersService, PermissionsGuard],
  controllers: [UsersController],
})
export class UsersModule {}
