/**
 * JWT 签发与校验：访问令牌（短期）、刷新令牌（长期）及密码重置 token 的 SHA256。
 *
 * - Access payload 含 `typ: 'access'`、用户 id、用户名、权限列表、jti
 * - Refresh 仅含 `typ: 'refresh'`、sub、jti；数据库中存 jti 用于吊销与旋转
 * - 使用 HS256；密钥来自 `JWT_SECRET` / `JWT_REFRESH_SECRET`
 */
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

/** 校验通过后解析出的访问令牌载荷（供 Guard 写入 req.user） */
export interface AccessPayload {
  sub: string
  username: string
  jti: string
  permissions: string[]
}

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  private get accessSecret(): string {
    return this.config.get<string>('jwtSecret')!
  }

  private get refreshSecret(): string {
    return this.config.get<string>('jwtRefreshSecret')!
  }

  /**
   * 签发访问令牌：默认 15 分钟有效；可传入已有 jti（一般用于续期场景）。
   */
  signAccess(payload: Omit<AccessPayload, 'jti'> & { jti?: string }): {
    token: string
    jti: string
    expiresInSec: number
  } {
    const jti = payload.jti ?? crypto.randomUUID()
    const expiresInSec = 15 * 60
    const token = jwt.sign(
      {
        sub: payload.sub,
        username: payload.username,
        permissions: payload.permissions,
        jti,
        typ: 'access',
      },
      this.accessSecret,
      { expiresIn: expiresInSec, algorithm: 'HS256' },
    )
    return { token, jti, expiresInSec }
  }

  /** 签发刷新令牌：默认 7 天；jti 入库以便撤销与一次性旋转 */
  signRefresh(sub: string): { token: string; jti: string; expiresInSec: number } {
    const jti = crypto.randomUUID()
    const expiresInSec = 7 * 24 * 60 * 60
    const token = jwt.sign(
      { sub, jti, typ: 'refresh' },
      this.refreshSecret,
      { expiresIn: expiresInSec, algorithm: 'HS256' },
    )
    return { token, jti, expiresInSec }
  }

  /** 校验访问令牌并断言 typ；失败抛 JsonWebTokenError */
  verifyAccess(token: string): AccessPayload {
    const decoded = jwt.verify(token, this.accessSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & {
      sub: string
      username: string
      jti: string
      permissions?: string[]
    }
    if (decoded.typ !== 'access')
      throw new jwt.JsonWebTokenError('invalid token type')
    return {
      sub: decoded.sub,
      username: decoded.username,
      jti: decoded.jti,
      permissions: Array.isArray(decoded.permissions)
        ? decoded.permissions
        : [],
    }
  }

  /** 校验刷新令牌，返回 sub + jti */
  verifyRefresh(token: string): { sub: string; jti: string } {
    const decoded = jwt.verify(token, this.refreshSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & { sub: string; jti: string; typ?: string }
    if (decoded.typ !== 'refresh')
      throw new jwt.JsonWebTokenError('invalid token type')
    return { sub: decoded.sub, jti: decoded.jti }
  }

  /** 对原始重置 token 做 SHA256 十六进制摘要，仅哈希入库 */
  sha256(value: string): string {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex')
  }
}
