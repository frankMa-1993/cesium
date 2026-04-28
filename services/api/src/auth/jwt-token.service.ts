import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

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

  verifyRefresh(token: string): { sub: string; jti: string } {
    const decoded = jwt.verify(token, this.refreshSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & { sub: string; jti: string; typ?: string }
    if (decoded.typ !== 'refresh')
      throw new jwt.JsonWebTokenError('invalid token type')
    return { sub: decoded.sub, jti: decoded.jti }
  }

  sha256(value: string): string {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex')
  }
}
