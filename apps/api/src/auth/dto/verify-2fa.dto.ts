import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}
