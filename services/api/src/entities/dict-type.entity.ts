/**
 * 字典类型：业务唯一 `code`（如生态指标），下挂多个版本快照。
 */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DictSnapshotEntity } from './dict-snapshot.entity'

@Entity('dict_types')
export class DictTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  code: string

  @Column({ type: 'varchar' })
  name: string

  @OneToMany(() => DictSnapshotEntity, (s) => s.dictType)
  snapshots: DictSnapshotEntity[]
}
