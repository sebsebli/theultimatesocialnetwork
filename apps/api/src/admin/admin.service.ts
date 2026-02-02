import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../entities/report.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getReports(status?: ReportStatus, limit = 20, offset = 0) {
    const qb = this.reportRepo.createQueryBuilder('report');
    if (status) {
      qb.where('report.status = :status', { status });
    }
    qb.orderBy('report.createdAt', 'DESC');
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async resolveReport(id: string, status: ReportStatus) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = status;
    return this.reportRepo.save(report);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reason reserved for moderation log
  async banUser(userId: string, reason: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.bannedAt = new Date();
    // Ideally log the reason in a moderation log table, but for now just ban.
    return this.userRepo.save(user);
  }

  async unbanUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.bannedAt = null;
    return this.userRepo.save(user);
  }
}
