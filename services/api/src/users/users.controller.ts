import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import type { Response } from 'express'

@ApiTags('users')
@Controller('users')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('user:read')
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.users.list({
      page: Math.max(1, parseInt(page, 10)),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10))),
      keyword,
      status,
    })
  }

  @Post('batch/status')
  @RequirePermissions('user:write')
  batchStatus(
    @Body() body: { ids: string[]; status: 'enabled' | 'disabled' },
  ) {
    return this.users.setStatus(body.ids, body.status)
  }

  @Post('batch/reset-password')
  @RequirePermissions('user:write')
  batchReset(@Body() body: { ids: string[] }) {
    return this.users.resetPassword(body.ids)
  }

  @Post('assign-roles')
  @RequirePermissions('user:write')
  assign(@Body() body: { userId: string; roleIds: string[] }) {
    return this.users.assignRoles(body.userId, body.roleIds)
  }

  @Get('export')
  @RequirePermissions('user:export')
  async export(@Res() res: Response) {
    const rows = await this.users.exportCsvRows()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"')
    const header =
      '账号,姓名,部门,角色,状态,最后登录\n'
    const lines = rows.map((u) => {
      const roles = (u.roles ?? []).map((r) => r.name).join(';')
      const dept = u.dept?.name ?? ''
      const last = u.lastLoginAt
        ? new Date(u.lastLoginAt).toISOString()
        : ''
      return [u.username, u.displayName, dept, roles, u.status, last]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    })
    res.send('\uFEFF' + header + lines.join('\n'))
  }
}
