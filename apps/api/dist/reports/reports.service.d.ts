import { Repository } from 'typeorm';
import { Report, ReportTargetType } from '../entities/report.entity';
import { SafetyService } from '../safety/safety.service';
export declare class ReportsService {
    private reportRepo;
    private safetyService;
    constructor(reportRepo: Repository<Report>, safetyService: SafetyService);
    create(userId: string, targetId: string, targetType: ReportTargetType, reason: string): Promise<{
        reporterId: string;
        targetId: string;
        targetType: ReportTargetType;
        reason: string;
    } & Report>;
}
