import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuditService } from './audit.service'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'

@ApiTags('audit')
@Controller('audit')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('login-logs')
  @RequirePermissions('audit:read')
  logs(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.audit.loginLogs({
      page: Math.max(1, parseInt(page, 10)),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10))),
    })
  }
}
