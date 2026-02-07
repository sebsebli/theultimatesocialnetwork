import {
  Controller,
  Get,
  Param,
  Query,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { ActivityPubService } from './activitypub.service';

@Controller('ap')
export class ActivityPubController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get('users/:handle')
  @Header('Content-Type', 'application/activity+json; charset=utf-8')
  async getActor(@Param('handle') handle: string) {
    const actor = await this.activityPubService.getActor(handle);
    if (!actor) throw new NotFoundException();
    return actor;
  }

  @Get('users/:handle/outbox')
  @Header('Content-Type', 'application/activity+json; charset=utf-8')
  async getOutbox(
    @Param('handle') handle: string,
    @Query('page') page?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 0;
    const result = await this.activityPubService.getOutbox(handle, pageNum);
    if (!result) throw new NotFoundException();
    return result;
  }

  @Get('posts/:id')
  @Header('Content-Type', 'application/activity+json; charset=utf-8')
  async getNote(@Param('id') id: string) {
    const note = await this.activityPubService.getNote(id);
    if (!note) throw new NotFoundException();
    return note;
  }
}
