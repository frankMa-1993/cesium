/**
 * 用户实体：账号基本信息、部门、多对多角色、登录安全字段（失败次数、锁定截止时间、最后登录）。
 */
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { DeptEntity } from './dept.entity'
import { RoleEntity } from './role.entity'

export type UserStatusValue = 'enabled' | 'disabled'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  username: string

  @Column({ type: 'varchar', nullable: true, unique: true })
  phone: string | null

  /** bcrypt 哈希，永不明文存储 */
  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string

  @Column({ name: 'display_name', type: 'varchar' })
  displayName: string

  @Column({ name: 'dept_id', type: 'varchar', nullable: true })
  deptId: string | null

  @ManyToOne(() => DeptEntity, { nullable: true })
  @JoinColumn({ name: 'dept_id' })
  dept: DeptEntity | null

  @Column({ type: 'varchar', length: 16, default: 'enabled' })
  status: UserStatusValue

  /** 密码错误累计达阈值时设置，过期前禁止登录 */
  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null

  @Column({ name: 'failed_attempts', type: 'integer', default: 0 })
  failedAttempts: number

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null

  @ManyToMany(() => RoleEntity, { cascade: false })
  @JoinTable({ name: 'user_roles' })
  roles: RoleEntity[]
}
