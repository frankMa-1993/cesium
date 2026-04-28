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

  @Get('captcha')
  captchaImage() {
    return this.captcha.create()
  }

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

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken)
  }

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

  @Post('forgot/request')
  async forgotRequest(@Body() body: ForgotRequestDto) {
    return this.auth.requestPasswordReset(body.identifier)
  }

  @Post('forgot/confirm')
  async forgotConfirm(@Body() body: ForgotConfirmDto) {
    return this.auth.confirmPasswordReset(
      body.token,
      body.newPassword,
      body.confirmPassword,
    )
  }
}
