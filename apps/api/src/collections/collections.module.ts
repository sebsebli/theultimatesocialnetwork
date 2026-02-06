import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
import { PostEdge } from '../entities/post-edge.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { ExternalSource } from '../entities/external-source.entity';
import { ExploreModule } from '../explore/explore.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    TypeOrmModule.forFeature([
      Collection,
      CollectionItem,
      Post,
      PostEdge,
      PostTopic,
      Topic,
      User,
      Follow,
      ExternalSource,
    ]),
    forwardRef(() => ExploreModule),
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
