import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AgentApiGuard } from './guards/agent-api.guard';
import { AgentApiService } from './agent-api.service';
import { CreatePostDto } from '../posts/dto/create-post.dto';

@Controller('internal/agents')
@UseGuards(AgentApiGuard)
export class AgentApiController {
  constructor(private agentService: AgentApiService) {}

  @Post('auth')
  async getAgentToken(@Body() body: { email: string }) {
    return this.agentService.getAgentToken(body.email);
  }

  @Post('posts')
  async createPost(@Body() body: { userId: string; dto: CreatePostDto }) {
    return this.agentService.createPost(body.userId, body.dto);
  }

  @Post('replies')
  async createReply(@Body() body: { userId: string; postId: string; body: string }) {
    return this.agentService.createReply(body.userId, body.postId, body.body);
  }
}
