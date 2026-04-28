import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('login_logs')
export class LoginLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', nullable: true })
  userId: string | null

  @Column({ name: 'logged_at', type: 'datetime' })
  loggedAt: Date

  @Column()
  ip: string

  @Column({ nullable: true })
  province: string | null

  @Column({ nullable: true })
  city: string | null

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string

  @Column({ default: false })
  success: boolean

  @Column({ name: 'fail_reason', type: 'text', nullable: true })
  failReason: string | null

  @Column({ name: 'session_id' })
  sessionId: string
}
