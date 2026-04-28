import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
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
    const hash = await bcrypt.hash(temp, rounds)
    await this.users.update({ id: In(ids) }, { passwordHash: hash })
    return { updated: ids.length, devTempPassword: process.env.NODE_ENV !== 'production' ? temp : undefined }
  }

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
