import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  captchaId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  captchaText!: string
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string
}

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
