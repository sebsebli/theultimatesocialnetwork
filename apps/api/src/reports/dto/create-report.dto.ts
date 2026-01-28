import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ReportTargetType } from '../../entities/report.entity';

export class CreateReportDto {
  @IsNotEmpty()
  @IsUUID()
  targetId: string;

  @IsNotEmpty()
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  reason: string;
}
