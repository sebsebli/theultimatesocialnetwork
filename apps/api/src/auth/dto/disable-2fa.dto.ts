import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Disable2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
