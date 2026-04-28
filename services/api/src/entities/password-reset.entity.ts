import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('password_resets')
export class PasswordResetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ name: 'token_hash' })
  tokenHash: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ name: 'used', default: false })
  used: boolean
}
