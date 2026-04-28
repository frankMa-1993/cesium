/**
 * 大屏数据源持久化：列表按更新时间倒序；更新时自动刷新 `updatedAt`。
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  ScreenDatasourceEntity,
  DatasourceTypeValue,
} from '../entities/screen-datasource.entity'

@Injectable()
export class ScreenService {
  constructor(
    @InjectRepository(ScreenDatasourceEntity)
    private readonly repo: Repository<ScreenDatasourceEntity>,
  ) {}

  list() {
    return this.repo.find({ order: { updatedAt: 'DESC' } })
  }

  async create(body: {
    name: string
    type: DatasourceTypeValue
    config: Record<string, unknown>
  }) {
    const row = await this.repo.save(
      this.repo.create({
        ...body,
        updatedAt: new Date(),
      }),
    )
    return row
  }

  async update(
    id: string,
    body: Partial<{ name: string; type: DatasourceTypeValue; config: Record<string, unknown> }>,
  ) {
    const row = await this.repo.findOneBy({ id })
    if (!row)
      throw new NotFoundException()
    Object.assign(row, body, { updatedAt: new Date() })
    return this.repo.save(row)
  }

  async remove(id: string) {
    await this.repo.delete({ id })
    return { ok: true }
  }
}
