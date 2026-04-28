/**
 * 角色只读接口：复用 `user:read` 权限，避免未授权用户枚举角色。
 */
import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoleEntity } from '../entities/role.entity'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'

@ApiTags('roles')
@Controller('roles')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class RolesController {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
  ) {}

  @Get()
  @RequirePermissions('user:read')
  list() {
    return this.roles.find({
      order: { name: 'ASC' },
      select: ['id', 'code', 'name'],
    })
  }
}
