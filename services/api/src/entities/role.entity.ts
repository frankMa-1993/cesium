/**
 * 角色实体：业务侧角色编码与名称，通过中间表关联权限与用户。
 */
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { PermissionEntity } from './permission.entity'
import { UserEntity } from './user.entity'

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  code: string

  @Column({ type: 'varchar' })
  name: string

  @ManyToMany(() => PermissionEntity, { eager: false })
  @JoinTable({ name: 'role_permissions' })
  permissions: PermissionEntity[]

  @ManyToMany(() => UserEntity, (u) => u.roles)
  users: UserEntity[]
}
