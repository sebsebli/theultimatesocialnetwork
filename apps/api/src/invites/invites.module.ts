import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  InvitesController,
  AdminInvitesController,
} from './invites.controller';
import { InvitesService } from './invites.service';
import { WaitingListController } from './waiting-list.controller';
import { AdminKeyGuard } from './admin-key.guard';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, User, WaitingList, SystemSetting]),
    SharedModule,
  ],
  controllers: [
    InvitesController,
    AdminInvitesController,
    WaitingListController,
  ],
  providers: [InvitesService, AdminKeyGuard],
  exports: [InvitesService],
})
export class InvitesModule {}
