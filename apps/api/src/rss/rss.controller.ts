import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { RssService } from './rss.service';

@Controller('rss')
@Throttle({ default: { limit: 20, ttl: 60000 } }) // Stricter limit for public RSS: 20 req/min per IP (DDoS protection)
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get(':handle')
  async getRss(@Param('handle') handle: string, @Res() res: Response) {
    const xml = await this.rssService.generateRss(handle);
    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  }

  @Get('u/:publicId')
  async getRssByPublicId(
    @Param('publicId') publicId: string,
    @Res() res: Response,
  ) {
    const xml = await this.rssService.generateRssByPublicId(publicId);
    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  }
}
