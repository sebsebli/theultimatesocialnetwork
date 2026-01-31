import { IsEmail, MaxLength } from 'class-validator';

export class JoinWaitingListDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}
