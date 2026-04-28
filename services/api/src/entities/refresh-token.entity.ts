import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  jti: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ default: false })
  revoked: boolean
}
