import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Post } from '../entities/post.entity';

@Controller('embed')
export class EmbedController {
  private readonly domain: string;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    private configService: ConfigService,
  ) {
    this.domain =
      this.configService
        .get<string>('FRONTEND_URL')
        ?.replace(/^https?:\/\//, '') || 'citewalk.com';
  }

  @Get(':id')
  async getEmbed(@Param('id') id: string, @Res() res: Response) {
    const post = await this.postRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['author'],
      select: ['id', 'title', 'body', 'createdAt', 'quoteCount', 'replyCount'],
    });

    if (!post || !post.author || post.author.isProtected) {
      throw new NotFoundException();
    }

    const title = post.title || '';
    const body = (post.body || '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 280);
    const author = post.author.displayName || post.author.handle;
    const handle = post.author.handle;
    const postUrl = `https://${this.domain}/p/${post.id}`;
    const date = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0B0B0C;color:#F2F2F2;padding:16px}
.card{border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;max-width:550px}
.author{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.author-info .name{font-size:14px;font-weight:600}
.author-info .handle{font-size:12px;color:#6E7A8A}
.title{font-size:18px;font-weight:700;margin-bottom:8px;line-height:1.3}
.body{font-size:14px;color:#A0A0A0;line-height:1.5;margin-bottom:12px}
.meta{font-size:12px;color:#6E7A8A;margin-bottom:12px}
.footer{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)}
.logo{font-size:11px;color:#6E7A8A;font-weight:600;letter-spacing:0.5px;text-decoration:none}
.read-more{font-size:12px;color:#6E7A8A;text-decoration:none;font-weight:500}
.read-more:hover{color:#F2F2F2}
.logo:hover{color:#F2F2F2}
</style>
</head>
<body>
<div class="card">
<div class="author"><div class="author-info"><div class="name">${this.esc(author)}</div><div class="handle">@${this.esc(handle)}</div></div></div>
${title ? `<div class="title">${this.esc(title)}</div>` : ''}
<div class="body">${this.esc(body)}${body.length >= 280 ? '...' : ''}</div>
<div class="meta">${date}${post.quoteCount > 0 ? ` · ${post.quoteCount} cites` : ''}</div>
<div class="footer"><a href="https://${this.esc(this.domain)}" target="_blank" rel="noopener" class="logo">CITEWALK</a><a href="${this.esc(postUrl)}" target="_blank" rel="noopener" class="read-more">Read on Citewalk →</a></div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.send(html);
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
