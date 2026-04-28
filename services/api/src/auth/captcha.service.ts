/**
 * 图形验证码服务：基于 svg-captcha 生成 SVG，验证码明文仅存于进程内 Map（TTL 5 分钟）。
 *
 * 验证成功后条目会被删除（一次性）。生产环境若多实例部署，应替换为 Redis 等
 * 共享存储，否则验证码与登录请求落到不同实例会校验失败。
 */
import { Injectable } from '@nestjs/common'
import * as svgCaptcha from 'svg-captcha' // 生产可换 svg-captcha-plus 等增强版
import * as crypto from 'crypto'

/** 内存中单条验证码记录 */
interface CaptchaEntry {
  /** 归一化后的小写答案，用于与用户输入比较 */
  text: string
  /** 过期时间戳（毫秒） */
  expiresAt: number
}

@Injectable()
export class CaptchaService {
  private readonly store = new Map<string, CaptchaEntry>()
  private readonly ttlMs = 5 * 60 * 1000

  /**
   * 生成新验证码：返回唯一 `id` 与 SVG 字符串，前端可内嵌或转 Data URL。
   */
  create(): { id: string; svg: string } {
    const cap = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f2f5',
    })
    const id = crypto.randomBytes(16).toString('hex')
    this.store.set(id, {
      text: cap.text.toLowerCase(),
      expiresAt: Date.now() + this.ttlMs,
    })
    return { id, svg: cap.data as unknown as string }
  }

  /**
   * 校验用户输入：成功返回 `ok` 并删除记录；过期或不存在返回 `expired`；内容不符返回 `invalid`。
   */
  validate(id: string, input: string): 'ok' | 'expired' | 'invalid' {
    const row = this.store.get(id)
    if (!row)
      return 'expired'
    if (Date.now() > row.expiresAt) {
      this.store.delete(id)
      return 'expired'
    }
    if (!input || input.toLowerCase().trim() !== row.text) {
      return 'invalid'
    }
    this.store.delete(id)
    return 'ok'
  }
}
