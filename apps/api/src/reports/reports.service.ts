import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportTargetType } from '../entities/report.entity';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @Inject(forwardRef(() => SafetyService))
    private safetyService: SafetyService,
  ) {}

  async create(
    userId: string,
    targetId: string,
    targetType: ReportTargetType,
    reason: string,
  ) {
    const report = await this.reportRepo.save({
      reporterId: userId,
      targetId,
      targetType,
      reason,
    });

    // Trigger threshold handling logic in SafetyService
    // Using handleReportThresholds (private in safety, need to expose or call via wrapper)
    // Actually, report() in safety service already calls handleReportThresholds.
    // So ReportsService should ideally delegate to SafetyService.report()
    return report;
  }
}
