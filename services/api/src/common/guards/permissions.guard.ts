import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthErrorCode } from '@cesium-eco/shared'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []
    if (required.length === 0)
      return true
    const req = context.switchToHttp().getRequest<{
      user?: { permissions?: string[] }
    }>()
    const have = new Set(req.user?.permissions ?? [])
    const ok = required.every((p) => have.has(p))
    if (!ok) {
      throw new ForbiddenException({
        code: AuthErrorCode.FORBIDDEN,
        message: '无权限执行此操作',
      })
    }
    return true
  }
}
