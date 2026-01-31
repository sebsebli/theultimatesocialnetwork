import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('threads')
  @UseGuards(AuthGuard('jwt'))
  async getThreads(@CurrentUser() user: { id: string }) {
    try {
      return await this.messagesService.getThreads(user.id);
    } catch (err) {
      console.error('messages/threads error', err);
      return [];
    }
  }

  /** Search current user's chats only. Auth required; filter applied server-side. */
  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async searchChats(
    @CurrentUser() user: { id: string },
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    return this.messagesService.searchChats(user.id, query ?? '', safeLimit);
  }

  @Post('threads')
  @UseGuards(AuthGuard('jwt'))
  createThread(
    @CurrentUser() user: { id: string },
    @Body() dto: { userId: string },
  ) {
    return this.messagesService.findOrCreateThread(user.id, dto.userId);
  }

  @Get('threads/:threadId/messages')
  @UseGuards(AuthGuard('jwt'))
  getMessages(
    @CurrentUser() user: { id: string },
    @Param('threadId') threadId: string,
  ) {
    return this.messagesService.getMessages(user.id, threadId);
  }

  @Post('threads/:threadId/messages')
  @UseGuards(AuthGuard('jwt'))
  sendMessage(
    @CurrentUser() user: { id: string },
    @Param('threadId') threadId: string,
    @Body() dto: { body: string },
  ) {
    return this.messagesService.sendMessage(user.id, threadId, dto.body);
  }
}
