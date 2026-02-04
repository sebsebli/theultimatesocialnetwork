import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { MeilisearchService } from '../search/meilisearch.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private meilisearch: MeilisearchService,
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

  /**
   * Trigger a full reindex of users, topics, posts, and messages from PostgreSQL into Meilisearch.
   * Runs in the background; use when search is missing results (e.g. after restore or if indexing failed).
   */
  triggerSearchReindex(): { message: string } {
    void this.meilisearch
      .reindexFromPostgres()
      .then(() => {})
      .catch((err) => console.error('Admin reindex failed', err));
    return {
      message:
        'Reindex started in background. Search may take a few minutes to reflect all data.',
    };
  }
}
