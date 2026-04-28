/**
 * 权限元数据装饰器：与 `PermissionsGuard` 配合，在 handler 或 class 上声明所需权限码。
 *
 * 使用 `Reflector.getAllAndOverride` 合并方法级与类级声明；无声明则守卫直接放行。
 */
import { SetMetadata } from '@nestjs/common'

/** Reflector 读取用的 metadata key，需与 PermissionsGuard 保持一致 */
export const PERMISSIONS_KEY = 'permissions'

/**
 * 声明访问该路由需要的权限码（全部满足才可访问，逻辑为 AND）。
 * @example @RequirePermissions('user:read')
 */
export const RequirePermissions = (...perms: string[]) =>
  SetMetadata(PERMISSIONS_KEY, perms)
