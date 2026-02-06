import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyController } from './safety.controller';
import { SafetyAdminController } from './safety-admin.controller';
import { SafetyService } from './safety.service';
import { ContentModerationService } from './content-moderation.service';
import { TrustService } from './trust.service';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import { SharedModule } from '../shared/shared.module';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { Report } from '../entities/report.entity';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { ModerationRecord } from '../entities/moderation-record.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      Block,
      Mute,
      Report,
      User,
      Post,
      Reply,
      ModerationRecord,
      Notification,
    ]),
  ],
  controllers: [SafetyController, SafetyAdminController],
  providers: [
    SafetyService,
    ContentModerationService,
    TrustService,
    AdminKeyGuard,
  ],
  exports: [SafetyService, ContentModerationService, TrustService],
})
export class SafetyModule {}
