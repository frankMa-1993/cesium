/**
 * 角色模块：提供角色列表查询（供用户分配角色等下拉使用）。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PermissionEntity } from '../entities/permission.entity'
import { RoleEntity } from '../entities/role.entity'
import { RolesController } from './roles.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([RoleEntity, PermissionEntity]),
  ],
  providers: [PermissionsGuard],
  controllers: [RolesController],
})
export class RolesModule {}
