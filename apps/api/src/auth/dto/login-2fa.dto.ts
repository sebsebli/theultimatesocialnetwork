import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Login2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;

  @IsString()
  @IsNotEmpty()
  tempToken: string;
}
