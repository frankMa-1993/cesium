/**
 * 部门实体：简单树可扩展为 parentId；当前与用户一对多。
 */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from './user.entity'

@Entity('departments')
export class DeptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  name: string

  @OneToMany(() => UserEntity, (u) => u.dept)
  users: UserEntity[]
}
