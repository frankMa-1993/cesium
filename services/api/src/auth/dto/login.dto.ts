/**
 * 认证相关请求体 DTO：配合 class-validator 与 Swagger 文档注解。
 * 全局 ValidationPipe 会剥离未声明字段并校验类型。
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/** 登录：账号可为用户名或手机号，须通过验证码 */
export class LoginDto {
  @ApiProperty({ description: '用户名或手机号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  identifier!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password!: string

  @ApiProperty({ description: 'GET /auth/captcha 返回的 id' })
  @IsString()
  @IsNotEmpty()
  captchaId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  captchaText!: string
}

/** 刷新会话 */
export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string
}

/** 申请密码重置：预留验证码字段便于后续与登录一致的风控 */
export class ForgotRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  identifier!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  captchaId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  captchaText?: string
}

/** 确认新密码：token 为邮件或开发环境返回的一次性明文经服务端哈希匹配 */
export class ForgotConfirmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  newPassword!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  confirmPassword!: string
}
