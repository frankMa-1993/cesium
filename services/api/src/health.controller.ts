/**
 * 存活探针：供负载均衡、K8s、运维脚本检测进程是否可响应。
 * 路由为根路径 `GET /health`（不受 `api/v1` 前缀影响）。
 */
import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', ts: new Date().toISOString() }
  }
}
