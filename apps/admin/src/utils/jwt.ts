/** 仅解析 payload（不验证签名；权限以服务端校验为准） */
export function decodeJwtPayload<T extends Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const part = token.split('.')[1]
    if (!part)
      return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as T
  }
  catch {
    return null
  }
}
