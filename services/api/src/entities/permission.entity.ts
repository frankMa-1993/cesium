/**
 * 权限实体：细粒度字符串码（如 `user:read`），与角色多对多。
 */
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RoleEntity } from './role.entity'

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  code: string

  @Column({ type: 'varchar' })
  name: string

  @ManyToMany(() => RoleEntity, (r) => r.permissions)
  roles: RoleEntity[]
}
