import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { RecommendationService } from './recommendation.service';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { TopicFollow } from '../entities/topic-follow.entity';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from '../shared/shared.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    SharedModule,
    SearchModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get('REDIS_URL') || 'redis://localhost:6379',
          ttl: 300000, // 5 minutes
        }),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Topic,
      User,
      Post,
      PostEdge,
      Follow,
      ExternalSource,
      PostTopic,
      Like,
      Keep,
      TopicFollow,
    ]),
    DatabaseModule,
  ],
  controllers: [ExploreController],
  providers: [ExploreService, RecommendationService],
  exports: [ExploreService, RecommendationService],
})
export class ExploreModule {}
