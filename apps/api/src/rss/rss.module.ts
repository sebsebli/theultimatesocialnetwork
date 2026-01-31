import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post]), SharedModule],
  controllers: [RssController],
  providers: [RssService],
})
export class RssModule {}
