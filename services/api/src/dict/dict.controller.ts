import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { DictService } from './dict.service'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import type { Request } from 'express'

@ApiTags('dict')
@Controller('dict')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class DictController {
  constructor(private readonly dict: DictService) {}

  @Get('types')
  @RequirePermissions('dict:read')
  types() {
    return this.dict.listTypes()
  }

  @Get('types/:typeId/items')
  @RequirePermissions('dict:read')
  items(@Param('typeId') typeId: string) {
    return this.dict.getWorkingItems(typeId)
  }

  @Post('types/:typeId/publish')
  @RequirePermissions('dict:write')
  publish(
    @Param('typeId') typeId: string,
    @Body() body: { items: { key: string; label: string; value: string }[] },
    @Req() req: Request & { user?: { sub: string } },
  ) {
    return this.dict.publish(typeId, body.items, req.user?.sub)
  }

  @Get('types/:typeId/versions')
  @RequirePermissions('dict:read')
  versions(@Param('typeId') typeId: string) {
    return this.dict.versions(typeId)
  }

  @Get('types/:typeId/diff')
  @RequirePermissions('dict:read')
  diff(
    @Param('typeId') typeId: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string,
  ) {
    return this.dict.diffVersions(
      typeId,
      parseInt(v1, 10),
      parseInt(v2, 10),
    )
  }
}
