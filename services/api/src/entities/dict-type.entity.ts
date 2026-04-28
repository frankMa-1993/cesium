import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DictSnapshotEntity } from './dict-snapshot.entity'

@Entity('dict_types')
export class DictTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  code: string

  @Column()
  name: string

  @OneToMany(() => DictSnapshotEntity, (s) => s.dictType)
  snapshots: DictSnapshotEntity[]
}
