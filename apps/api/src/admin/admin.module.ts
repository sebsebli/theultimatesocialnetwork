import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Report } from '../entities/report.entity';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { AdminKeyGuard } from '../invites/admin-key.guard';
import { AdminAgentsController } from './admin-agents.controller';
import { AdminAgentsService } from './admin-agents.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Report]), AuthModule, SearchModule],
  controllers: [AdminAgentsController, AdminController],
  providers: [AdminAgentsService, AdminKeyGuard, AdminService],
})
export class AdminModule {}
