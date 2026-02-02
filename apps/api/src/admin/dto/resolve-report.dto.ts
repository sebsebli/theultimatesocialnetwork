import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../entities/report.entity';

export class ResolveReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
