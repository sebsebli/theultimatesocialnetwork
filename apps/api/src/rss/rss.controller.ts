import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { RssService } from './rss.service';

@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get(':handle')
  async getRss(@Param('handle') handle: string, @Res() res: Response) {
    const xml = await this.rssService.generateRss(handle);
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  }
}
