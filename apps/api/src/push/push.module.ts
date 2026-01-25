import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PushToken } from '../entities/push-token.entity';
import { PushOutbox } from '../entities/push-outbox.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { ApnsSender } from './senders/apns.sender';
import { FcmSender } from './senders/fcm.sender';
import { PushWorker } from './push.worker';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken, PushOutbox, NotificationPref])],
  controllers: [PushController],
  providers: [PushService, ApnsSender, FcmSender, PushWorker],
  exports: [PushService],
})
export class PushModule {}
