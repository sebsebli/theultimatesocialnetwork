import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KeepsService } from './keeps.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('keeps')
export class KeepsController {
  constructor(private readonly keepsService: KeepsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getAll(
    @CurrentUser() user: { id: string },
    @Query('search') search?: string,
    @Query('inCollection') inCollection?: string,
  ) {
    return this.keepsService.getAll(user.id, {
      search,
      inCollection: inCollection === 'true',
    });
  }
}
