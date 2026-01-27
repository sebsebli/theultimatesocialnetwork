import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;

  /** Preferred language for the sign-in email (e.g. "en", "de"). Defaults to "en". */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang?: string;
}
