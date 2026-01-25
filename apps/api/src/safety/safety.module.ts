import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { ContentModerationService } from './content-moderation.service';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Mute, Report, User, Post, Reply])],
  controllers: [SafetyController],
  providers: [SafetyService, ContentModerationService],
  exports: [SafetyService, ContentModerationService],
})
export class SafetyModule {}
