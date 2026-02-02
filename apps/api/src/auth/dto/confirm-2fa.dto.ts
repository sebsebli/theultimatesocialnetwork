import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Confirm2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;

  @IsString()
  @IsNotEmpty()
  secret: string;
}
