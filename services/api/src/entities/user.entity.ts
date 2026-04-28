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

  @Column({ unique: true })
  username: string

  @Column({ nullable: true, unique: true })
  phone: string | null

  @Column({ name: 'password_hash' })
  passwordHash: string

  @Column({ name: 'display_name' })
  displayName: string

  @Column({ name: 'dept_id', nullable: true })
  deptId: string | null

  @ManyToOne(() => DeptEntity, { nullable: true })
  @JoinColumn({ name: 'dept_id' })
  dept: DeptEntity | null

  @Column({ type: 'varchar', length: 16, default: 'enabled' })
  status: UserStatusValue

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts: number

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null

  @ManyToMany(() => RoleEntity, { cascade: false })
  @JoinTable({ name: 'user_roles' })
  roles: RoleEntity[]
}
