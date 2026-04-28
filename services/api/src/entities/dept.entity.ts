import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from './user.entity'

@Entity('departments')
export class DeptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @OneToMany(() => UserEntity, (u) => u.dept)
  users: UserEntity[]
}
