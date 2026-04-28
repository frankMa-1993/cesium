import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import { RoleEntity } from './role.entity'

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name: string

  @ManyToMany(() => RoleEntity, (r) => r.permissions)
  roles: RoleEntity[]
}
