/**
 * 用户领域服务：查询构建、批量更新、角色多对多维护、导出原始行。
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { hash as bcryptHash } from '../common/bcrypt-promise'
import { In, Repository } from 'typeorm'
import { UserEntity } from '../entities/user.entity'
import { RoleEntity } from '../entities/role.entity'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    private readonly config: ConfigService,
  ) {}

  /**
   * 分页查询用户，预加载部门与角色；关键字匹配用户名、显示名、手机号。
   */
  async list(q: {
    page: number
    pageSize: number
    keyword?: string
    status?: string
  }) {
    const qb = this.users
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.dept', 'd')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.username', 'ASC')
    if (q.keyword) {
      qb.andWhere(
        '(u.username LIKE :kw OR u.displayName LIKE :kw OR u.phone LIKE :kw)',
        { kw: `%${q.keyword}%` },
      )
    }
    if (q.status)
      qb.andWhere('u.status = :st', { st: q.status })
    const [items, total] = await qb
      .skip((q.page - 1) * q.pageSize)
      .take(q.pageSize)
      .getManyAndCount()
    return {
      total,
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        deptName: u.dept?.name ?? '',
        roles: (u.roles ?? []).map((r) => ({ id: r.id, code: r.code, name: r.name })),
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        phone: u.phone,
      })),
    }
  }

  async setStatus(ids: string[], status: 'enabled' | 'disabled') {
    await this.users.update({ id: In(ids) }, { status })
    return { updated: ids.length }
  }

  async resetPassword(ids: string[]) {
    const rounds = this.config.get<number>('bcryptSaltRounds') ?? 10
    const temp = `Reset@${Math.random().toString(36).slice(2, 10)}`
    const hash = await bcryptHash(temp, rounds)
    await this.users.update({ id: In(ids) }, { passwordHash: hash })
    return { updated: ids.length, devTempPassword: process.env.NODE_ENV !== 'production' ? temp : undefined }
  }

  /** 以给定 roleIds 完整替换用户的角色集合 */
  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['roles'],
    })
    if (!user)
      throw new NotFoundException('user not found')
    const roles = await this.roles.findBy({ id: In(roleIds) })
    user.roles = roles
    await this.users.save(user)
    return { ok: true }
  }

  exportCsvRows() {
    return this.users.find({
      relations: ['dept', 'roles'],
      order: { username: 'ASC' },
    })
  }
}
