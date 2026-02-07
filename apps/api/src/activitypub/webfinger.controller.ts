import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

@Controller('.well-known')
export class WebFingerController {
  private readonly domain: string;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    this.domain =
      this.configService
        .get<string>('FRONTEND_URL')
        ?.replace(/^https?:\/\//, '') || 'citewalk.com';
  }

  @Get('webfinger')
  async webfinger(@Query('resource') resource: string) {
    if (!resource) throw new BadRequestException('resource parameter required');

    const match = resource.match(/^acct:([^@]+)@(.+)$/);
    if (!match) throw new BadRequestException('Invalid resource format');

    const [, handle, domain] = match;
    if (domain !== this.domain) throw new NotFoundException();

    const user = await this.userRepo.findOne({
      where: { handle },
      select: ['id', 'handle', 'isProtected'],
    });
    if (!user || user.isProtected) throw new NotFoundException();

    return {
      subject: `acct:${handle}@${this.domain}`,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `https://${this.domain}/ap/users/${handle}`,
        },
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: `https://${this.domain}/user/${handle}`,
        },
      ],
    };
  }
}
