import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { PostRead } from '../entities/post-read.entity';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SharedModule } from '../shared/shared.module';
import Redis from 'ioredis';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Keep, Post, PostRead]),
    SharedModule,
    ConfigModule,
  ],
  controllers: [InteractionsController],
  providers: [
    InteractionsService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return new Redis(redisUrl || 'redis://redis:6379');
      },
      inject: [ConfigService],
    },
  ],
})
export class InteractionsModule {}
