import { ReportTargetType } from '../../entities/report.entity';
export declare class CreateReportDto {
    targetId: string;
    targetType: ReportTargetType;
    reason: string;
}
