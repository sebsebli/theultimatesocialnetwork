import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { UploadService } from './upload.service';
import { SafetyService } from '../safety/safety.service';
import { defaultQueueConfig } from '../common/queue-config';

export type ImageUploadType =
  | 'profile_picture'
  | 'profile_header'
  | 'header_image';

export interface ImageModerationJobData {
  key: string;
  uploadType: ImageUploadType;
  userId: string;
}

/**
 * Worker for async image moderation. When MODERATION_IMAGE_ASYNC=true, uploads
 * are stored immediately and this worker runs NSFW check in the background.
 * On failure: removes object from storage and clears the key from user/post.
 * Scales with multiple worker replicas for thousands of concurrent uploads.
 */
@Injectable()
export class ImageModerationWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ImageModerationWorker.name);
  private worker: Worker<ImageModerationJobData>;

  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private configService: ConfigService,
    private uploadService: UploadService,
    private safetyService: SafetyService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
  ) {}

  onApplicationBootstrap() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.worker = new Worker<ImageModerationJobData>(
      'image-moderation',
      async (job: Job<ImageModerationJobData>) => this.runJob(job),
      {
        connection: new Redis(redisUrl || 'redis://redis:6379', {
          maxRetriesPerRequest: null,
        }),
        ...defaultQueueConfig,
      },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Image moderation job ${job?.id} failed: ${err?.message}`,
      );
    });
  }

  async onApplicationShutdown() {
    await this.worker?.close().catch(() => {});
  }

  private async runJob(job: Job<ImageModerationJobData>): Promise<void> {
    const { key, uploadType, userId } = job.data;
    const buffer = await this.uploadService.getImageBuffer(key);
    if (!buffer) {
      this.logger.warn(`Image ${key} not found in storage; skipping`);
      return;
    }
    const result = await this.safetyService.checkImage(buffer);
    if (result.safe) {
      return;
    }
    this.logger.warn(
      `Image moderation failed for ${key} (${uploadType}): ${result.reason}`,
    );
    await this.uploadService.removeUpload(key);
    if (uploadType === 'profile_picture') {
      await this.userRepo.update(
        { id: userId, avatarKey: key },
        { avatarKey: null },
      );
    } else if (uploadType === 'profile_header') {
      await this.userRepo.update(
        { id: userId, profileHeaderKey: key },
        { profileHeaderKey: null },
      );
    } else if (uploadType === 'header_image') {
      await this.postRepo.update(
        { headerImageKey: key },
        { headerImageKey: null },
      );
    }
  }
}
