import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { UploadController } from './upload.controller';
import { ImagesController } from './images.controller';
import { UploadService } from './upload.service';
import { ImageModerationWorker } from './image-moderation.worker';
import { SafetyModule } from '../safety/safety.module';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { defaultQueueConfig } from '../common/queue-config';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    SafetyModule,
    TypeOrmModule.forFeature([User, Post]),
    SharedModule,
  ],
  controllers: [UploadController, ImagesController],
  providers: [
    UploadService,
    ImageModerationWorker,
    {
      provide: 'IMAGE_MODERATION_QUEUE',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Queue('image-moderation', {
          connection: new Redis(redisUrl || 'redis://redis:6379', {
            maxRetriesPerRequest: null,
          }),
          ...defaultQueueConfig,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
