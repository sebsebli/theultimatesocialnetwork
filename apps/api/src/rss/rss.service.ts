import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post, PostVisibility } from '../entities/post.entity';

/** Max number of items in a profile RSS feed. */
const RSS_ITEM_LIMIT = 50;

@Injectable()
export class RssService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private configService: ConfigService,
  ) {}

  /**
   * Generate RSS 2.0 feed for a user profile. Only public profiles are allowed;
   * protected (private) profiles return 404 so the feed stops immediately.
   * Items are title + link only (no full content) to support free data and speech
   * while linking to the app's profile and articles.
   */
  async generateRss(handle: string): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { handle },
      select: ['id', 'handle', 'displayName', 'isProtected'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
      this.configService.get<string>('FRONTEND_URL') || 'https://cite.app'
    ).replace(/\/$/, '');
    const apiBase = (
      this.configService.get<string>('API_URL') || 'https://api.cite.app'
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
        const description = escapeXml(`${title} — Read on Cite`);
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
      `${user.displayName} (@${user.handle}) on Cite`,
    );
    const channelLink = `${appBase}/user/${user.handle}`;
    const selfLink = `${apiBase}/rss/${encodeURIComponent(user.handle)}`;

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>Latest posts from ${escapeXml(user.displayName)} on Cite — links to profile and articles</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Cite RSS Generator</generator>
    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  }
}
