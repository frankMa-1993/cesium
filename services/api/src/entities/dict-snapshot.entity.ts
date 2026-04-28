import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { DictTypeEntity } from './dict-type.entity'

@Entity('dict_snapshots')
export class DictSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'dict_type_id' })
  dictTypeId: string

  @ManyToOne(() => DictTypeEntity, (t) => t.snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dict_type_id' })
  dictType: DictTypeEntity

  @Column({ type: 'integer' })
  version: number

  @Column({ type: 'simple-json' })
  snapshot: { key: string; label: string; value: string }[]

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null
}
