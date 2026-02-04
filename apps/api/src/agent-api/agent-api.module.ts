import { Module } from '@nestjs/common';
import { AgentApiController } from './agent-api.controller';
import { AgentApiService } from './agent-api.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { RepliesModule } from '../replies/replies.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { FollowsModule } from '../follows/follows.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PostsModule,
    RepliesModule,
    InteractionsModule,
    FollowsModule,
  ],
  controllers: [AgentApiController],
  providers: [AgentApiService],
})
export class AgentApiModule {}
