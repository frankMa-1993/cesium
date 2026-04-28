/**
 * 认证 HTTP 接口：验证码、登录、当前用户资料、刷新令牌、登出、忘记密码流程。
 *
 * - JWT 模式：`login` 返回 access/refresh；受保护接口使用 `Authorization: Bearer`
 * - Session 模式：`login` 不写 token，向 `req.session` 写入 userId 等；`HybridAuthGuard` 读 Session
 */
import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { CaptchaService } from './captcha.service'
import {
  ForgotConfirmDto,
  ForgotRequestDto,
  LoginDto,
  RefreshDto,
} from './dto/login.dto'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly captcha: CaptchaService,
    private readonly config: ConfigService,
  ) {}

  /** 返回 SVG 验证码图片与 `id`，前端提交登录时需带上 `captchaId` + `captchaText` */
  @Get('captcha')
  captchaImage() {
    return this.captcha.create()
  }

  /** 当前登录用户摘要（JWT 或 Session 任一模式） */
  @Get('profile')
  @UseGuards(HybridAuthGuard)
  @ApiBearerAuth('Bearer')
  profile(
    @Req()
    req: Request & {
      user?: { sub: string; username: string; permissions: string[] }
    },
  ) {
    const u = req.user!
    return {
      sub: u.sub,
      username: u.username,
      permissions: u.permissions,
    }
  }

  /**
   * 用户名/手机号 + 密码 + 验证码登录。
   * Session 模式下成功后会写入 session；JWT 模式返回双令牌。
   */
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
    @Headers('x-forwarded-for') forwarded: string,
  ) {
    const mode = (this.config.get<string>('authMode') ?? 'jwt').toLowerCase()
    const issueTokens = mode !== 'session'
    const result = await this.auth.login(
      body,
      { forwardedFor: forwarded, remote: ip, userAgent: ua },
      { issueTokens },
    )
    if (!issueTokens && 'user' in result && result.user && req.session) {
      req.session.userId = result.user.id
      req.session.username = result.user.username
      req.session.permissions = result.permissions ?? []
    }
    return result
  }

  /** 用 refresh token 换新 access + refresh（旋转刷新令牌） */
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken)
  }

  /** 撤销可选的 refresh jti 并销毁服务端 Session（若存在） */
  @Post('logout')
  @UseGuards(HybridAuthGuard)
  @ApiBearerAuth('Bearer')
  async logout(
    @Req() req: Request & { user?: { sub: string } },
    @Body() body: { refreshJti?: string },
  ) {
    await this.auth.logout(req.user!.sub, body?.refreshJti)
    req.session?.destroy(() => undefined)
    return { ok: true }
  }

  /** 申请重置密码：开发环境可能在响应中带 `devToken`，生产应发邮件 */
  @Post('forgot/request')
  async forgotRequest(@Body() body: ForgotRequestDto) {
    return this.auth.requestPasswordReset(body.identifier)
  }

  /** 使用一次性 token 设置新密码 */
  @Post('forgot/confirm')
  async forgotConfirm(@Body() body: ForgotConfirmDto) {
    return this.auth.confirmPasswordReset(
      body.token,
      body.newPassword,
      body.confirmPassword,
    )
  }
}
