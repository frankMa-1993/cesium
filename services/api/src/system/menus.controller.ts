/**
 * 系统菜单：后端静态配置 + 按当前用户 permissions 过滤，返回前端侧栏可用路由。
 * 菜单项上的 `perm` 表示至少需要该读权限才显示对应模块入口。
 */
import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import type { MenuItem } from '@cesium-eco/shared'

const FULL: (MenuItem & { perm?: string })[] = [
  {
    path: '/users',
    name: 'users',
    title: '用户管理',
    perm: 'user:read',
  },
  {
    path: '/dict',
    name: 'dict',
    title: '数据字典',
    perm: 'dict:read',
  },
  {
    path: '/audit',
    name: 'audit',
    title: '登录审计',
    perm: 'audit:read',
  },
  {
    path: '/screen',
    name: 'screen',
    title: '大屏数据源',
    perm: 'screen:read',
  },
  {
    path: '/monitor/video',
    name: 'videoMonitor',
    title: '视频监控',
    perm: 'monitor:read',
  },
]

@ApiTags('system')
@Controller('system')
@UseGuards(HybridAuthGuard)
@ApiBearerAuth('Bearer')
export class MenusController {
  @Get('menus')
  menus(
    @Req() req: Request & { user?: { permissions?: string[] } },
  ) {
    const have = new Set(req.user?.permissions ?? [])
    const items: MenuItem[] = FULL.filter(
      (m) => !m.perm || have.has(m.perm),
    ).map(({ perm: _p, ...rest }) => rest)
    return { items }
  }
}
