import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class Login2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;

  @IsString()
  @IsNotEmpty()
  tempToken: string;

  /** Optional device/browser description for "Where you're signed in". */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceInfo?: string;
}
