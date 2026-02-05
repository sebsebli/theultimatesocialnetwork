import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { Post } from '../entities/post.entity';
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
