import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { PushWorker } from './push.worker';
import { PushToken } from '../entities/push-token.entity';
import { PushOutbox } from '../entities/push-outbox.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushToken, PushOutbox]),
    ConfigModule,
    SharedModule,
  ],
  controllers: [PushController],
  providers: [PushService, PushWorker],
  exports: [PushService],
})
export class PushModule {}