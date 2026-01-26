import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class RssService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async generateRss(handle: string): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { handle } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.postsRepository.find({
      where: { author_id: user.id, visibility: 'PUBLIC' },
      order: { created_at: 'DESC' },
      take: 20,
    });

    const lastBuildDate = new Date().toUTCString();

    const items = posts.map((post) => {
      const title = post.title || 'Untitled Post';
      const link = `https://cite.app/post/${post.id}`;
      const date = new Date(post.created_at).toUTCString();
      const description = post.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <description>${description}</description>
    </item>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${user.display_name} (@${user.handle}) on Cite</title>
    <link>https://cite.app/user/${user.handle}</link>
    <description>Latest posts from ${user.display_name} on Cite</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Cite RSS Generator</generator>
    <atom:link href="https://api.cite.app/rss/${user.handle}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  }
}
