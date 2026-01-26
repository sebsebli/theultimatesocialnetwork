import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  controllers: [RssController],
  providers: [RssService],
})
export class RssModule {}
