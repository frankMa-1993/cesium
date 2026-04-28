/**
 * 认证模块：登录、验证码、JWT/Session 混合守卫、刷新令牌、找回密码相关仓储。
 *
 * 导出 `AuthService`、`JwtTokenService`、`HybridAuthGuard` 供其他模块复用
 * （例如仅需鉴权而不暴露认证路由的模块）。
 */
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../entities/user.entity'
import { LoginLogEntity } from '../entities/login-log.entity'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'
import { PasswordResetEntity } from '../entities/password-reset.entity'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtTokenService } from './jwt-token.service'
import { CaptchaService } from './captcha.service'
import { GeoipService } from '../geoip/geoip.service'
import { HybridAuthGuard } from '../common/guards/hybrid-auth.guard'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      LoginLogEntity,
      RefreshTokenEntity,
      PasswordResetEntity,
    ]),
  ],
  providers: [
    AuthService,
    JwtTokenService,
    CaptchaService,
    GeoipService,
    HybridAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtTokenService, HybridAuthGuard],
})
export class AuthModule {}
