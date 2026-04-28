import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleEntity } from '../entities/role.entity'
import { RolesController } from './roles.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([RoleEntity])],
  providers: [PermissionsGuard],
  controllers: [RolesController],
})
export class RolesModule {}
