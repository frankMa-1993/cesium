import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type DatasourceTypeValue =
  | 'STATIC_JSON'
  | 'REST'
  | 'WEBSOCKET'
  | 'MQTT'

@Entity('screen_datasources')
export class ScreenDatasourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'varchar', length: 32 })
  type: DatasourceTypeValue

  @Column({ type: 'simple-json' })
  config: Record<string, unknown>

  @Column({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date
}
