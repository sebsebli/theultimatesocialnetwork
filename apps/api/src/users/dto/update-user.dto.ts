import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  handle?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarKey?: string | null;

  @IsString()
  @IsOptional()
  profileHeaderKey?: string | null;

  @IsBoolean()
  @IsOptional()
  isProtected?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
