import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running daily cleanup...');
    await this.deleteOldSoftDeletedPosts();
    await this.deleteOldSoftDeletedUsers();
  }

  private async deleteOldSoftDeletedPosts() {
    // Hard delete posts soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.postRepo
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where('deleted_at IS NOT NULL')
      .andWhere('deleted_at < :date', { date: thirtyDaysAgo })
      .execute();

    if (result.affected && result.affected > 0) {
        this.logger.log(`Hard deleted ${result.affected} old posts.`);
    }
  }

  private async deleteOldSoftDeletedUsers() {
    // Hard delete users soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.userRepo
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('deleted_at IS NOT NULL')
      .andWhere('deleted_at < :date', { date: thirtyDaysAgo })
      .execute();

    if (result.affected && result.affected > 0) {
        this.logger.log(`Hard deleted ${result.affected} old users.`);
    }
  }
}
