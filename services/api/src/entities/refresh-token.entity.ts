/**
 * 刷新令牌持久化：存储 JWT 中的 jti，支持吊销、过期判断与按用户旋转。
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  jti: string

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ type: 'boolean', default: false })
  revoked: boolean
}
