import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
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
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 minutes (in milliseconds)
      max: 1000, // Max items in cache
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
    ]),
    DatabaseModule,
  ],
  controllers: [ExploreController],
  providers: [ExploreService, RecommendationService],
  exports: [ExploreService, RecommendationService],
})
export class ExploreModule {}
