import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { PushOutbox } from '../entities/push-outbox.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(PushOutbox)
    private pushOutboxRepo: Repository<PushOutbox>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    const start = Date.now();
    this.logger.log('Starting daily cleanup...');

    await this.deleteOldSoftDeletedPosts();
    await this.deleteOldSoftDeletedUsers();
    await this.deleteOldNotifications();
    await this.deleteOldPushOutbox();

    const duration = Date.now() - start;
    this.logger.log(`Daily cleanup completed in ${duration}ms`);
  }

  private async deleteOldNotifications() {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('created_at < :date', { date: sixtyDaysAgo })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted ${result.affected} old notifications.`);
    }
  }

  private async deleteOldPushOutbox() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.pushOutboxRepo
      .createQueryBuilder()
      .delete()
      .from(PushOutbox)
      .where('created_at < :date', { date: thirtyDaysAgo })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted ${result.affected} old push outbox items.`);
    }
  }

  private async deleteOldSoftDeletedPosts() {
    // Anonymize posts soft-deleted more than 30 days ago (GDPR safe: keep title/structure, remove PII)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.postRepo
      .createQueryBuilder()
      .update(Post)
      .set({
        authorId: null, // Remove link to user
        body: '', // Remove content
        headerImageKey: null,
        headerImageBlurhash: null,
        media: null,
        visibility: 'PUBLIC' as any, // Reset visibility
        status: 'PUBLISHED', // Keep published state for graph consistency
        updatedAt: new Date(),
        // deletedAt remains set, so it's still "soft deleted" in queries
      })
      .where('deleted_at IS NOT NULL')
      .andWhere('deleted_at < :date', { date: thirtyDaysAgo })
      // Only anonymize if not already anonymized
      .andWhere('author_id IS NOT NULL')
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Anonymized ${result.affected} old posts (GDPR cleanup).`);
    }
  }

  private async deleteOldSoftDeletedUsers() {
    // Hard delete users soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First: Anonymize all posts by these users (even if posts are not 30 days old yet)
    // We must break the link before deleting the user row
    const usersToDelete = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id')
      .where('u.deleted_at IS NOT NULL')
      .andWhere('u.deleted_at < :date', { date: thirtyDaysAgo })
      .getMany();
    
    const userIds = usersToDelete.map(u => u.id);
    
    if (userIds.length > 0) {
        // Anonymize posts immediately for these users
        await this.postRepo
            .createQueryBuilder()
            .update(Post)
            .set({
                authorId: null,
                body: '', // We also clear body as it implies authorship/personal data
                headerImageKey: null,
                headerImageBlurhash: null,
                media: null,
                updatedAt: new Date(),
                deletedAt: new Date(), // Mark as deleted if not already
            })
            .where('author_id IN (:...userIds)', { userIds })
            .execute();

        // Now hard delete the users
        const result = await this.userRepo
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('id IN (:...userIds)', { userIds })
        .execute();

        if (result.affected && result.affected > 0) {
            this.logger.log(`Hard deleted ${result.affected} old users and anonymized their posts.`);
        }
    }
  }
}
