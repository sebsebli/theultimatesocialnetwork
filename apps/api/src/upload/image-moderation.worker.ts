import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { UploadService } from './upload.service';
import { SafetyService } from '../safety/safety.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';

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
export class ImageModerationWorker implements OnApplicationBootstrap {
  private readonly logger = new Logger(ImageModerationWorker.name);

  constructor(
    @Inject('REDIS_CLIENT') private redis: import('ioredis').default,
    private uploadService: UploadService,
    private safetyService: SafetyService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @Inject(EVENT_BUS) private eventBus: IEventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.eventBus.subscribe<ImageModerationJobData>(
      'image-moderation',
      async (_event, data) => {
        await this.runJob(data);
      },
      { concurrency: 3 },
    );
  }

  private async runJob(data: ImageModerationJobData): Promise<void> {
    const { key, uploadType, userId } = data;
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
