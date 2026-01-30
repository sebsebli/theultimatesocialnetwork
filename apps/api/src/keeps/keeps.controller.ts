import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.keepsService.getAll(user.id, {
      search,
      inCollection: inCollection === 'true',
      page,
      limit,
    });
  }
}
