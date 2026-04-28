/**
 * 密码哈希统一出口：重新导出 `bcryptjs` 的 `hash` / `compare`。
 *
 * 使用纯 JS 实现而非带原生绑定的 `bcrypt`，避免在受限网络或交叉编译环境下
 * 预编译二进制下载失败导致安装/构建中断；强度由 `BCRYPT_ROUNDS` 配置。
 */
export { compare, hash } from 'bcryptjs'
