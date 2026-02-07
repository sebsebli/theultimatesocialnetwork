import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityPubController } from './activitypub.controller';
import { ActivityPubService } from './activitypub.service';
import { WebFingerController } from './webfinger.controller';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  controllers: [ActivityPubController, WebFingerController],
  providers: [ActivityPubService],
  exports: [ActivityPubService],
})
export class ActivityPubModule {}
