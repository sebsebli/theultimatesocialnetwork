import { IsBoolean, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class JoinWaitingListDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  /** Optional: explicit consent to be contacted about updates and open beta (GDPR). */
  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}
