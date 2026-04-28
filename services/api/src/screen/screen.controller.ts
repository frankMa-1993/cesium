import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ScreenService } from './screen.service'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'
import type { DatasourceTypeValue } from '../entities/screen-datasource.entity'

@ApiTags('screen')
@Controller('screen/datasources')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class ScreenController {
  constructor(private readonly screen: ScreenService) {}

  @Get()
  @RequirePermissions('screen:read')
  list() {
    return this.screen.list()
  }

  @Post()
  @RequirePermissions('screen:write')
  create(
    @Body()
    body: {
      name: string
      type: DatasourceTypeValue
      config: Record<string, unknown>
    },
  ) {
    return this.screen.create(body)
  }

  @Put(':id')
  @RequirePermissions('screen:write')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string
      type: DatasourceTypeValue
      config: Record<string, unknown>
    }>,
  ) {
    return this.screen.update(id, body)
  }

  @Delete(':id')
  @RequirePermissions('screen:write')
  remove(@Param('id') id: string) {
    return this.screen.remove(id)
  }
}
