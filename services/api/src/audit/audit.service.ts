/**
 * 审计服务：封装 `LoginLogEntity` 的分页查询与 DTO 映射。
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoginLogEntity } from '../entities/login-log.entity'

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(LoginLogEntity)
    private readonly logs: Repository<LoginLogEntity>,
  ) {}

  async loginLogs(q: { page: number; pageSize: number }) {
    const [items, total] = await this.logs.findAndCount({
      order: { loggedAt: 'DESC' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    })
    return {
      total,
      items: items.map((e) => ({
        id: e.id,
        userId: e.userId,
        loggedAt: e.loggedAt,
        ip: e.ip,
        province: e.province,
        city: e.city,
        userAgent: e.userAgent,
        success: e.success,
        failReason: e.failReason,
        sessionId: e.sessionId,
      })),
    }
  }
}
