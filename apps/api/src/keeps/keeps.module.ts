import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeepsController } from './keeps.controller';
import { KeepsService } from './keeps.service';
import { Keep } from '../entities/keep.entity';
import { Post } from '../entities/post.entity';
import { CollectionItem } from '../entities/collection-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Keep, Post, CollectionItem])],
  controllers: [KeepsController],
  providers: [KeepsService],
})
export class KeepsModule {}
