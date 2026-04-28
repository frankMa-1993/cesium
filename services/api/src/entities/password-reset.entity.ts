/**
 * 密码重置一次性记录：仅存 token 的 SHA256，原始 token 仅邮件/开发响应中传递。
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('password_resets')
export class PasswordResetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string

  @Column({ name: 'token_hash', type: 'varchar' })
  tokenHash: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ name: 'used', type: 'boolean', default: false })
  used: boolean
}
