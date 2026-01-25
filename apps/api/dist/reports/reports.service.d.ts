import { Repository } from 'typeorm';
import { Report, ReportTargetType } from '../entities/report.entity';
export declare class ReportsService {
    private reportRepo;
    constructor(reportRepo: Repository<Report>);
    create(userId: string, targetId: string, targetType: ReportTargetType, reason: string): Promise<{
        reporterId: string;
        targetId: string;
        targetType: ReportTargetType;
        reason: string;
    } & Report>;
}
