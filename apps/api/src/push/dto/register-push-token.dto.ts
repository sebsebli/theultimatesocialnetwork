import { IsIn, IsOptional, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @IsIn(['APNS', 'FCM'])
  provider: 'APNS' | 'FCM';

  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsOptional()
  @IsString()
  app_version?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsIn(['sandbox', 'production'])
  apns_environment?: 'sandbox' | 'production';
}
