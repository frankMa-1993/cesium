/**
 * 混合鉴权守卫：根据 `AUTH_MODE` 在 Session 与 JWT Bearer 之间切换。
 *
 * - `session`：要求 `req.session.userId` 存在，并组装 `req.user`
 * - 默认 JWT：解析 `Authorization: Bearer`，校验访问令牌后写入 `req.user`
 *
 * 与 `PermissionsGuard` 链式使用时，应先挂载本守卫再挂载权限守卫。
 */
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
