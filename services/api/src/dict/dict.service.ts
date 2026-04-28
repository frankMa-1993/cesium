/**
 * 字典领域服务：快照版本链、按 key 集合做 added/removed/modified 差异（共享类型 `DictItemDiffRow`）。
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { DictItemDiffRow } from '@cesium-eco/shared'
import { DictTypeEntity } from '../entities/dict-type.entity'
import { DictSnapshotEntity } from '../entities/dict-snapshot.entity'

type Row = { key: string; label: string; value: string }

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(DictTypeEntity)
    private readonly types: Repository<DictTypeEntity>,
    @InjectRepository(DictSnapshotEntity)
    private readonly snaps: Repository<DictSnapshotEntity>,
  ) {}

  listTypes() {
    return this.types.find({ order: { code: 'ASC' } })
  }

  async getWorkingItems(typeId: string): Promise<Row[]> {
    if (!(await this.types.existsBy({ id: typeId })))
      throw new NotFoundException()
    const last = await this.snaps.findOne({
      where: { dictTypeId: typeId },
      order: { version: 'DESC' },
    })
    return last?.snapshot ?? []
  }

  /**
   * 预留草稿入口：当前实现直接转调 publish（若需草稿表可在此拆分）。
   */
  async saveDraft(typeId: string, items: Row[], userId?: string) {
    return this.publish(typeId, items, userId)
  }

  async publish(typeId: string, items: Row[], userId?: string) {
    const t = await this.types.findOneBy({ id: typeId })
    if (!t)
      throw new NotFoundException()
    const last = await this.snaps.findOne({
      where: { dictTypeId: typeId },
      order: { version: 'DESC' },
    })
    const version = (last?.version ?? 0) + 1
    const snap = await this.snaps.save(
      this.snaps.create({
        dictTypeId: typeId,
        version,
        snapshot: items,
        createdAt: new Date(),
        createdBy: userId ?? null,
      }),
    )
    return snap
  }

  async versions(typeId: string) {
    return this.snaps.find({
      where: { dictTypeId: typeId },
      order: { version: 'DESC' },
      select: ['id', 'version', 'createdAt', 'createdBy'],
    })
  }

  async snapshotByVersion(typeId: string, version: number) {
    const s = await this.snaps.findOne({
      where: { dictTypeId: typeId, version },
    })
    if (!s)
      throw new NotFoundException()
    return s
  }

  /**
   * 对两个快照条目列表做 key 级 diff，输出排序后的变更列表。
   */
  diff(
    a: Row[],
    b: Row[],
  ): DictItemDiffRow[] {
    const ma = new Map(a.map((x) => [x.key, x]))
    const mb = new Map(b.map((x) => [x.key, x]))
    const keys = new Set([...ma.keys(), ...mb.keys()])
    const out: DictItemDiffRow[] = []
    for (const k of keys) {
      const la = ma.get(k)
      const lb = mb.get(k)
      if (la && !lb) {
        out.push({
          key: k,
          label: la.label,
          value: la.value,
          change: 'removed',
        })
        continue
      }
      if (!la && lb) {
        out.push({
          key: k,
          label: lb.label,
          value: lb.value,
          change: 'added',
        })
        continue
      }
      if (la && lb) {
        if (la.label !== lb.label || la.value !== lb.value) {
          out.push({
            key: k,
            label: lb.label,
            value: lb.value,
            change: 'modified',
          })
        }
      }
    }
    return out.sort((x, y) => x.key.localeCompare(y.key))
  }

  async diffVersions(typeId: string, v1: number, v2: number) {
    if (v1 === v2)
      throw new BadRequestException('请选择两个不同版本')
    const [s1, s2] = await Promise.all([
      this.snapshotByVersion(typeId, v1),
      this.snapshotByVersion(typeId, v2),
    ])
    return this.diff(s1.snapshot, s2.snapshot)
  }
}
