import { IsEmail, IsString, IsOptional, MaxLength } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  /** Optional device/browser description for "Where you're signed in" (e.g. "iPhone 14", "Chrome on Windows"). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceInfo?: string;
}
