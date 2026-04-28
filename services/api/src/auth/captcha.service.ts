import { Injectable } from '@nestjs/common'
import * as svgCaptcha from 'svg-captcha'
import * as crypto from 'crypto'

interface CaptchaEntry {
  text: string
  expiresAt: number
}

/** 验证码：内存存储；生产可接 Redis（同接口） */
@Injectable()
export class CaptchaService {
  private readonly store = new Map<string, CaptchaEntry>()
  private readonly ttlMs = 5 * 60 * 1000

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
