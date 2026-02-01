import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import { AdminAgentsController } from './admin-agents.controller';
import { AdminAgentsService } from './admin-agents.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, SearchModule],
  controllers: [AdminAgentsController],
  providers: [AdminAgentsService, AdminKeyGuard],
})
export class AdminModule {}
