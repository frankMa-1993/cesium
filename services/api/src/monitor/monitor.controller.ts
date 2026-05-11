/**
 * 视频监控预设流地址：供管理端 Mock / 演示拉流，真实环境可改为读库或配置中心。
 */
import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RequirePermissions } from '../common/decorators/require-permissions.decorator'

/** 单路视频：按 FLV → HLS → RTMP 优先级由前端依次尝试 */
export interface VideoPresetSlotDto {
  id: string
  title: string
  /** HTTP-FLV，优先使用 flv.js */
  flvUrl?: string
  /** HLS，其次使用 hls.js / 原生 */
  hlsUrl?: string
  /** 浏览器一般无法直接播 RTMP，仅作占位与错误提示演练 */
  rtmpUrl?: string
}

@ApiTags('monitor')
@Controller('monitor')
@UseGuards(HybridAuthGuard, PermissionsGuard)
@ApiBearerAuth('Bearer')
export class MonitorController {
  /**
   * 公开可访问的演示用地址（可能随 CDN 策略变化；生产请换自有源站）。
   * - FLV：火山引擎示例片
   * - HLS：Mux / Google Shaka 测试流
   */
  @Get('video-presets')
  @RequirePermissions('monitor:read')
  videoPresets(): { items: VideoPresetSlotDto[] } {
    return {
      items: [
        {
          id: 'demo-1',
          title: '演示-HTTP-FLV 片源',
          flvUrl:
            'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-360p.flv',
          hlsUrl:
            'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
        },
        {
          id: 'demo-2',
          title: '演示-HLS (Mux 测试流)',
          flvUrl: undefined,
          hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          rtmpUrl: 'rtmp://127.0.0.1/live/mock-fallback',
        },
        {
          id: 'demo-3',
          title: '演示-HLS (Shaka 示例)',
          hlsUrl:
            'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
        },
        {
          id: 'demo-4',
          title: '演示-仅 RTMP 占位（浏览器不可播）',
          flvUrl: undefined,
          hlsUrl: undefined,
          rtmpUrl: 'rtmp://live.example.com/live/stream',
        },
      ],
    }
  }
}
