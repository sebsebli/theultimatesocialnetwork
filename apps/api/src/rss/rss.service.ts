import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { User } from '../entities/user.entity';
import { Post, PostVisibility } from '../entities/post.entity';

/** Max number of items in a profile RSS feed. */
const RSS_ITEM_LIMIT = 50;
/** Cache TTL in seconds: feed is regenerated at most every 5 min when requested. */
const RSS_CACHE_TTL_SEC = 300;

@Injectable()
export class RssService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private configService: ConfigService,
  ) {}

  /**
   * Generate RSS 2.0 feed for a user profile. Only public profiles are allowed;
   * protected (private) profiles return 404 so the feed stops immediately.
   * Items are title + link only (no full content) to support free data and speech
   * while linking to the app's profile and articles.
   * Feed is cached for a short period (RSS_CACHE_TTL_SEC) so updates happen only
   * when requested and at reasonable intervals.
   */
  async generateRss(handle: string): Promise<string> {
    const cacheKey = `rss:${handle}`;
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({
      where: { handle },
      select: ['id', 'handle', 'displayName', 'isProtected', 'publicId'],
    });
    if (!user) throw new NotFoundException('User not found');

    const xml = await this.buildRss(user, 'handle');
    await this.redis
      .set(cacheKey, xml, 'EX', RSS_CACHE_TTL_SEC)
      .catch(() => {});
    return xml;
  }

  async generateRssByPublicId(publicId: string): Promise<string> {
    const cacheKey = `rss:u:${publicId}`;
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) return cached;

    const user = await this.usersRepository.findOne({
      where: { publicId },
      select: ['id', 'handle', 'displayName', 'isProtected', 'publicId'],
    });
    if (!user) throw new NotFoundException('User not found');

    const xml = await this.buildRss(user, 'publicId');
    await this.redis
      .set(cacheKey, xml, 'EX', RSS_CACHE_TTL_SEC)
      .catch(() => {});
    return xml;
  }

  private async buildRss(
    user: User,
    idType: 'handle' | 'publicId',
  ): Promise<string> {
    if (user.isProtected) {
      throw new NotFoundException('Feed not available for this profile');
    }

    const posts = await this.postsRepository.find({
      where: { authorId: user.id, visibility: PostVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
      take: RSS_ITEM_LIMIT,
      select: ['id', 'title', 'createdAt'],
    });

    const appBase = (
      this.configService.get<string>('FRONTEND_URL') || 'https://citewalk.com'
    ).replace(/\/$/, '');
    const apiBase = (
      this.configService.get<string>('API_URL') || 'https://api.citewalk.app'
    ).replace(/\/$/, '');

    const escapeXml = (unsafe: string) =>
      String(unsafe ?? '').replace(/[<>&"']/g, (c) => {
        switch (c) {
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '&':
            return '&amp;';
          case '"':
            return '&quot;';
          case "'":
            return '&apos;';
          default:
            return c;
        }
      });

    const items = posts
      .map((post) => {
        const title = post.title || 'Untitled Post';
        const link = `${appBase}/post/${post.id}`;
        const date = new Date(post.createdAt).toUTCString();
        const description = escapeXml(`${title} — Read on Citewalk`);
        return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${description}</description>
    </item>`;
      })
      .join('');

    const channelTitle = escapeXml(
      `${user.displayName} (@${user.handle}) on Citewalk`,
    );
    const channelLink = `${appBase}/user/${user.handle}`;

    // Prefer publicId for self link if available/requested, otherwise handle
    const selfLinkSuffix =
      idType === 'publicId'
        ? `u/${user.publicId}`
        : encodeURIComponent(user.handle);
    const selfLink = `${apiBase}/rss/${selfLinkSuffix}`;

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>Latest posts from ${escapeXml(user.displayName)} on Citewalk — links to profile and articles</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Citewalk RSS Generator</generator>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  }
}
