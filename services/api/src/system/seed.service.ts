/**
 * 启动种子数据：`onModuleInit` 在空库时创建默认部门、权限、超级管理员角色、admin 账号及演示字典。
 *
 * 生产环境务必修改默认密码；若库中已有用户则跳过用户种子，已有字典类型则跳过字典种子。
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { hash as bcryptHash } from '../common/bcrypt-promise'
import { DataSource } from 'typeorm'
import { PermissionEntity } from '../entities/permission.entity'
import { RoleEntity } from '../entities/role.entity'
import { UserEntity } from '../entities/user.entity'
import { DeptEntity } from '../entities/dept.entity'
import { DictTypeEntity } from '../entities/dict-type.entity'
import { DictSnapshotEntity } from '../entities/dict-snapshot.entity'

const DEFAULT_PERMS: { code: string; name: string }[] = [
  { code: 'user:read', name: '用户-查看' },
  { code: 'user:write', name: '用户-维护' },
  { code: 'user:export', name: '用户-导出' },
  { code: 'dict:read', name: '字典-查看' },
  { code: 'dict:write', name: '字典-维护' },
  { code: 'audit:read', name: '审计-查看' },
  { code: 'screen:read', name: '大屏-查看' },
  { code: 'screen:write', name: '大屏-维护' },
  { code: 'monitor:read', name: '监控-查看' },
]

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly log = new Logger(SeedService.name)

  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser()
    await this.ensureBuiltinPermissions()
    await this.seedDemoDict()
  }

  /**
   * 将 DEFAULT_PERMS 中新增项写入库并挂到 `super` 角色，便于已有环境升级后自动获得新菜单权限。
   */
  private async ensureBuiltinPermissions() {
    const permRepo = this.ds.getRepository(PermissionEntity)
    const roleRepo = this.ds.getRepository(RoleEntity)
    const superRole = await roleRepo.findOne({
      where: { code: 'super' },
      relations: ['permissions'],
    })
    if (!superRole)
      return
    let changed = false
    for (const p of DEFAULT_PERMS) {
      let perm = await permRepo.findOne({ where: { code: p.code } })
      if (!perm) {
        perm = await permRepo.save(permRepo.create({ code: p.code, name: p.name }))
        this.log.log(`Added permission ${p.code}`)
      }
      if (!superRole.permissions.some((x) => x.code === p.code)) {
        superRole.permissions.push(perm)
        changed = true
      }
    }
    if (changed)
      await roleRepo.save(superRole)
  }

  private async seedAdminUser() {
    const users = this.ds.getRepository(UserEntity)
    if ((await users.count()) > 0) {
      this.log.log('Skip admin seed')
      return
    }
    this.log.warn('Seeding default admin (change password in production)')
    const deptRepo = this.ds.getRepository(DeptEntity)
    const root = await deptRepo.save(deptRepo.create({ name: '总部' }))
    const permRepo = this.ds.getRepository(PermissionEntity)
    const savedPerms = await permRepo.save(
      DEFAULT_PERMS.map((p) =>
        permRepo.create({ code: p.code, name: p.name }),
      ),
    )
    const roleRepo = this.ds.getRepository(RoleEntity)
    const adminRole = await roleRepo.save(
      roleRepo.create({
        code: 'super',
        name: '超级管理员',
        permissions: savedPerms,
      }),
    )
    const hash = await bcryptHash('Admin@123', 10)
    await users.save(
      users.create({
        username: 'admin',
        phone: '13800138000',
        passwordHash: hash,
        displayName: '系统管理员',
        deptId: root.id,
        status: 'enabled',
        roles: [adminRole],
      }),
    )
  }

  private async seedDemoDict() {
    const dtRepo = this.ds.getRepository(DictTypeEntity)
    const snapRepo = this.ds.getRepository(DictSnapshotEntity)
    if ((await dtRepo.count()) > 0) {
      this.log.log('Skip dict demo seed')
      return
    }
    const eco = await dtRepo.save(
      dtRepo.create({ code: 'eco_indicator', name: '生态监测指标' }),
    )
    await snapRepo.save(
      snapRepo.create({
        dictTypeId: eco.id,
        version: 1,
        snapshot: [
          { key: 'aqi', label: 'AQI', value: '优' },
          { key: 'water', label: '水质', value: 'II类' },
        ],
        createdAt: new Date(),
        createdBy: null,
      }),
    )
  }
}
