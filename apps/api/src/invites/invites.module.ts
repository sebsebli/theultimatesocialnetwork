import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitesController, AdminInvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { WaitingListController } from './waiting-list.controller';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { WaitingList } from '../entities/waiting-list.entity';
import { SystemSetting } from '../entities/system-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, User, WaitingList, SystemSetting]),
  ],
  controllers: [InvitesController, AdminInvitesController, WaitingListController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
