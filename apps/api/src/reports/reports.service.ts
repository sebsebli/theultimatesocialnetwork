import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportTargetType } from '../entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
  ) {}

  async create(userId: string, targetId: string, targetType: ReportTargetType, reason: string) {
    return this.reportRepo.save({
      reporterId: userId,
      targetId,
      targetType,
      reason,
    });
  }
}