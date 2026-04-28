/**
 * 认证领域服务：登录校验（验证码、账号状态、密码、失败锁定）、JWT 颁发与刷新、
 * 登录审计（含 GeoIP）、刷新令牌旋转、登出吊销、找回密码。
 *
 * 错误码与前端约定见 `@cesium-eco/shared` 的 `AuthErrorCode`。
 */
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { compare as bcryptCompare, hash as bcryptHash } from '../common/bcrypt-promise'
import { Repository } from 'typeorm'
import { AuthErrorCode } from '@cesium-eco/shared'
import { JwtTokenService } from './jwt-token.service'
import { GeoipService } from '../geoip/geoip.service'
import { UserEntity } from '../entities/user.entity'
import { LoginLogEntity } from '../entities/login-log.entity'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'
import { PasswordResetEntity } from '../entities/password-reset.entity'
import { CaptchaService } from './captcha.service'
import * as crypto from 'crypto'

/** 连续失败次数上限，达到后触发临时锁定 */
const MAX_FAILED = 5
/** 锁定持续时间（分钟） */
const LOCK_MINUTES = 30

/**
 * 将用户关联的所有角色下的权限码合并为去重数组，作为 JWT / Session 中的 permissions。
 */
function collectPermissions(user: UserEntity): string[] {
  const set = new Set<string>()
  for (const r of user.roles ?? []) {
    for (const p of r.permissions ?? []) {
      set.add(p.code)
    }
  }
  return [...set]
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtToken: JwtTokenService,
    private readonly geoip: GeoipService,
    private readonly captcha: CaptchaService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(LoginLogEntity)
    private readonly loginLogs: Repository<LoginLogEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetEntity)
    private readonly passwordResets: Repository<PasswordResetEntity>,
  ) {}

  /**
   * 解析客户端 IP：优先 `X-Forwarded-For` 第一项（代理链最左侧一般为原始客户端）。
   */
  private clientIp(forwarded: string | undefined, remote?: string): string {
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim()
      if (first)
        return first
    }
    return remote ?? '0.0.0.0'
  }

  /**
   * 写入登录日志：成功/失败均记录，便于审计大屏与风控；sessionId 在 JWT 模式下为 access jti。
   */
  private async audit(
    userId: string | null,
    ip: string,
    userAgent: string,
    success: boolean,
    failReason: string | null,
    sessionId: string,
  ) {
    const loc = this.geoip.lookup(ip)
    await this.loginLogs.save(
      this.loginLogs.create({
        userId,
        loggedAt: new Date(),
        ip,
        province: loc.province,
        city: loc.city,
        userAgent,
        success,
        failReason,
        sessionId,
      }),
    )
  }

  /**
   * 核心登录流程：验证码 → 查用户 → 状态/锁定 → 密码比对 → 清零失败计数 →
   * 可选颁发 JWT 对或仅返回用户与权限（Session 模式由 Controller 写 session）。
   */
  async login(
    body: {
      identifier: string
      password: string
      captchaId: string
      captchaText: string
    },
    meta: { forwardedFor?: string; remote?: string; userAgent?: string },
    options: { issueTokens?: boolean } = {},
  ) {
    const issueTokens = options.issueTokens !== false
    const cap = this.captcha.validate(body.captchaId, body.captchaText)
    if (cap === 'expired') {
      await this.audit(
        null,
        this.clientIp(meta.forwardedFor, meta.remote),
        meta.userAgent ?? '',
        false,
        AuthErrorCode.CAPTCHA_EXPIRED,
        'captcha',
      )
      throw new UnauthorizedException({
        code: AuthErrorCode.CAPTCHA_EXPIRED,
        message: '验证码已失效，请刷新后重试',
      })
    }
    if (cap === 'invalid') {
      await this.audit(
        null,
        this.clientIp(meta.forwardedFor, meta.remote),
        meta.userAgent ?? '',
        false,
        AuthErrorCode.CAPTCHA_INVALID,
        'captcha',
      )
      throw new UnauthorizedException({
        code: AuthErrorCode.CAPTCHA_INVALID,
        message: '验证码错误',
      })
    }

    const user = await this.users.findOne({
      where: [{ username: body.identifier }, { phone: body.identifier }],
      relations: ['roles', 'roles.permissions', 'dept'],
    })

    const ip = this.clientIp(meta.forwardedFor, meta.remote)
    const ua = meta.userAgent ?? ''
    const sessionBase = crypto.randomUUID()

    if (!user) {
      await this.audit(null, ip, ua, false, AuthErrorCode.USER_NOT_FOUND, sessionBase)
      throw new UnauthorizedException({
        code: AuthErrorCode.USER_NOT_FOUND,
        message: '账号不存在',
      })
    }

    if (user.status === 'disabled') {
      await this.audit(user.id, ip, ua, false, AuthErrorCode.ACCOUNT_LOCKED, sessionBase)
      throw new ForbiddenException({
        code: AuthErrorCode.ACCOUNT_LOCKED,
        message: '账号已锁定',
      })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.audit(user.id, ip, ua, false, AuthErrorCode.ACCOUNT_LOCKED, sessionBase)
      throw new ForbiddenException({
        code: AuthErrorCode.ACCOUNT_LOCKED,
        message: '账号已锁定，请稍后再试',
      })
    }

    const ok = await bcryptCompare(body.password, user.passwordHash)
    if (!ok) {
      user.failedAttempts += 1
      if (user.failedAttempts >= MAX_FAILED) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      }
      await this.users.save(user)
      await this.audit(user.id, ip, ua, false, AuthErrorCode.INVALID_PASSWORD, sessionBase)
      throw new UnauthorizedException({
        code: AuthErrorCode.INVALID_PASSWORD,
        message: '密码错误',
      })
    }

    user.failedAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await this.users.save(user)

    const perms = collectPermissions(user)
    let sessionId: string = crypto.randomUUID()
    if (issueTokens) {
      const access = this.jwtToken.signAccess({
        sub: user.id,
        username: user.username,
        permissions: perms,
      })
      const refresh = this.jwtToken.signRefresh(user.id)
      const expMs = refresh.expiresInSec * 1000
      await this.refreshTokens.save(
        this.refreshTokens.create({
          jti: refresh.jti,
          userId: user.id,
          expiresAt: new Date(Date.now() + expMs),
          revoked: false,
        }),
      )
      sessionId = access.jti
      await this.audit(user.id, ip, ua, true, null, sessionId)
      return {
        accessToken: access.token,
        refreshToken: refresh.token,
        expiresIn: access.expiresInSec,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          displayName: user.displayName,
          deptId: user.deptId,
          status: user.status,
        },
        permissions: perms,
      }
    }

    await this.audit(user.id, ip, ua, true, null, sessionId)
    return {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        displayName: user.displayName,
        deptId: user.deptId,
        status: user.status,
      },
      permissions: perms,
    }
  }

  /**
   * 刷新令牌：校验 JWT → 查库未吊销且未过期 → 吊销旧 jti → 签发新 access + refresh 并入库新 jti。
   */
  async refresh(refreshToken: string) {
    let decoded: { sub: string; jti: string }
    try {
      decoded = this.jwtToken.verifyRefresh(refreshToken)
    } catch {
      throw new UnauthorizedException({
        code: AuthErrorCode.REFRESH_INVALID,
        message: '刷新令牌无效或已过期',
      })
    }

    const row = await this.refreshTokens.findOne({
      where: { jti: decoded.jti, revoked: false },
    })
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: AuthErrorCode.REFRESH_INVALID,
        message: '刷新令牌无效或已过期',
      })
    }

    const user = await this.users.findOne({
      where: { id: decoded.sub },
      relations: ['roles', 'roles.permissions'],
    })
    if (!user || user.status !== 'enabled') {
      throw new UnauthorizedException({
        code: AuthErrorCode.UNAUTHORIZED,
        message: '用户不可用',
      })
    }

    row.revoked = true
    await this.refreshTokens.save(row)

    const perms = collectPermissions(user)
    const access = this.jwtToken.signAccess({
      sub: user.id,
      username: user.username,
      permissions: perms,
    })
    const next = this.jwtToken.signRefresh(user.id)
    const expMs = next.expiresInSec * 1000
    await this.refreshTokens.save(
      this.refreshTokens.create({
        jti: next.jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + expMs),
        revoked: false,
      }),
    )

    return {
      accessToken: access.token,
      refreshToken: next.token,
      expiresIn: access.expiresInSec,
    }
  }

  /** 若提供 refreshJti，则将对应行标记 revoked（登出时可选传入） */
  async logout(userId: string, refreshJti?: string) {
    if (refreshJti) {
      const row = await this.refreshTokens.findOne({
        where: { jti: refreshJti, userId },
      })
      if (row) {
        row.revoked = true
        await this.refreshTokens.save(row)
      }
    }
    return { ok: true }
  }

  /**
   * 请求重置密码：即使用户不存在也返回 sent:true，避免枚举账号；
   * 开发环境返回 `devToken` 便于联调，生产应发邮件链接。
   */
  async requestPasswordReset(identifier: string) {
    const user = await this.users.findOne({
      where: [{ username: identifier }, { phone: identifier }],
    })
    if (!user) {
      return { sent: true }
    }
    const raw = crypto.randomBytes(32).toString('hex')
    const tokenHash = this.jwtToken.sha256(raw)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await this.passwordResets.save(
      this.passwordResets.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        used: false,
      }),
    )
    return { sent: true, devToken: process.env.NODE_ENV !== 'production' ? raw : undefined }
  }

  /** 校验 token 哈希、未使用、未过期后更新密码并标记记录已用 */
  async confirmPasswordReset(
    rawToken: string,
    newPassword: string,
    confirm: string,
  ) {
    if (newPassword !== confirm)
      throw new BadRequestException('两次密码不一致')
    const tokenHash = this.jwtToken.sha256(rawToken)
    const row = await this.passwordResets.findOne({
      where: { tokenHash, used: false },
    })
    if (!row || row.expiresAt < new Date())
      throw new BadRequestException('链接已失效，请重新申请')
    const rounds = this.config.get<number>('bcryptSaltRounds') ?? 10
    const hash = await bcryptHash(newPassword, rounds)
    await this.users.update(row.userId, { passwordHash: hash })
    row.used = true
    await this.passwordResets.save(row)
    return { ok: true }
  }
}
