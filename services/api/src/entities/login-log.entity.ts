/**
 * 登录审计日志：每次登录尝试一条记录；失败时 `failReason` 为 `AuthErrorCode` 字符串。
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('login_logs')
export class LoginLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null

  @Column({ name: 'logged_at', type: 'datetime' })
  loggedAt: Date

  @Column({ type: 'varchar' })
  ip: string

  @Column({ type: 'varchar', nullable: true })
  province: string | null

  @Column({ type: 'varchar', nullable: true })
  city: string | null

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string

  @Column({ type: 'boolean', default: false })
  success: boolean

  @Column({ name: 'fail_reason', type: 'text', nullable: true })
  failReason: string | null

  /** JWT 模式下可为 access jti；Session 模式下为随机 UUID */
  @Column({ name: 'session_id', type: 'varchar' })
  sessionId: string
}
