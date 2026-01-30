import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('og')
  @UseGuards(AuthGuard('jwt'))
  async getOg(@Query('url') url: string) {
    if (!url || typeof url !== 'string') {
      return { title: null, description: null, image: null };
    }
    return this.metadataService.getOpenGraph(url);
  }
}
