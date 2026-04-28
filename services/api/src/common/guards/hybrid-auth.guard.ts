import 'express-session'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { AuthErrorCode } from '@cesium-eco/shared'
import { JwtTokenService } from '../../auth/jwt-token.service'

@Injectable()
export class HybridAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtToken: JwtTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<
      Request & { user?: { sub: string; username: string; permissions: string[] } }
    >()
    const mode = (this.config.get<string>('authMode') ?? 'jwt').toLowerCase()
    if (mode === 'session') {
      const s = req.session
      const uid = s?.userId
      if (!uid) {
        throw new UnauthorizedException({
          code: AuthErrorCode.UNAUTHORIZED,
          message: '未登录或会话已过期',
        })
      }
      req.user = {
        sub: uid,
        username: s?.username ?? '',
        permissions: s?.permissions ?? [],
      }
      return true
    }
    const h = req.headers['authorization']
    if (!h?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: AuthErrorCode.UNAUTHORIZED,
        message: '未授权',
      })
    }
    try {
      const payload = this.jwtToken.verifyAccess(h.slice(7))
      req.user = {
        sub: payload.sub,
        username: payload.username,
        permissions: payload.permissions,
      }
      return true
    } catch {
      throw new UnauthorizedException({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message: '访问令牌无效或已过期',
      })
    }
  }
}
