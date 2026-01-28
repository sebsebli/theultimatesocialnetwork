import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from '../entities/post.entity';
import { Follow } from '../entities/follow.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Collection } from '../entities/collection.entity';
import { User } from '../entities/user.entity';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Follow, CollectionItem, Collection, User, Block, Mute]),
    SharedModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}