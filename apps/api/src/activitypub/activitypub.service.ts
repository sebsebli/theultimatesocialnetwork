import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class ActivityPubService {
  private readonly domain: string;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    private configService: ConfigService,
  ) {
    this.domain =
      this.configService
        .get<string>('FRONTEND_URL')
        ?.replace(/^https?:\/\//, '') || 'citewalk.com';
  }

  async getActor(handle: string) {
    const user = await this.userRepo.findOne({
      where: { handle },
      select: [
        'id',
        'handle',
        'displayName',
        'bio',
        'avatarKey',
        'isProtected',
        'createdAt',
      ],
    });
    if (!user || user.isProtected) return null;

    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
      ],
      id: `https://${this.domain}/ap/users/${user.handle}`,
      type: 'Person',
      preferredUsername: user.handle,
      name: user.displayName || user.handle,
      summary: user.bio || '',
      inbox: `https://${this.domain}/ap/users/${user.handle}/inbox`,
      outbox: `https://${this.domain}/ap/users/${user.handle}/outbox`,
      followers: `https://${this.domain}/ap/users/${user.handle}/followers`,
      following: `https://${this.domain}/ap/users/${user.handle}/following`,
      url: `https://${this.domain}/user/${user.handle}`,
      published: user.createdAt?.toISOString(),
      manuallyApprovesFollowers: false,
      discoverable: true,
      endpoints: {
        sharedInbox: `https://${this.domain}/ap/inbox`,
      },
    };
  }

  async getOutbox(handle: string, page = 1, limit = 20) {
    const user = await this.userRepo.findOne({
      where: { handle },
      select: ['id', 'handle', 'isProtected'],
    });
    if (!user || user.isProtected) return null;

    const outboxUrl = `https://${this.domain}/ap/users/${handle}/outbox`;

    if (page === 0) {
      // Return ordered collection (index page)
      const countResult = await this.postRepo.count({
        where: { authorId: user.id, deletedAt: IsNull() },
      });
      return {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: outboxUrl,
        type: 'OrderedCollection',
        totalItems: countResult,
        first: `${outboxUrl}?page=1`,
        last: `${outboxUrl}?page=${Math.ceil(countResult / limit) || 1}`,
      };
    }

    // Return ordered collection page
    const offset = (page - 1) * limit;
    const posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      select: ['id', 'title', 'body', 'createdAt'],
    });

    const items = posts.map((post) => this.postToActivity(post, handle));

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${outboxUrl}?page=${page}`,
      type: 'OrderedCollectionPage',
      partOf: outboxUrl,
      orderedItems: items,
      ...(posts.length === limit
        ? { next: `${outboxUrl}?page=${page + 1}` }
        : {}),
      ...(page > 1 ? { prev: `${outboxUrl}?page=${page - 1}` } : {}),
    };
  }

  async getNote(postId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId, deletedAt: IsNull() },
      relations: ['author'],
      select: ['id', 'title', 'body', 'createdAt', 'authorId'],
    });
    if (!post || !post.author || post.author.isProtected) return null;

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      ...this.postToNote(post, post.author.handle),
    };
  }

  private postToActivity(post: Post, handle: string) {
    return {
      id: `https://${this.domain}/ap/posts/${post.id}/activity`,
      type: 'Create',
      actor: `https://${this.domain}/ap/users/${handle}`,
      published: post.createdAt?.toISOString(),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [`https://${this.domain}/ap/users/${handle}/followers`],
      object: this.postToNote(post, handle),
    };
  }

  private postToNote(post: Post, handle: string) {
    const content = post.body || '';
    // Strip markdown for plain text summary
    const plainText = content
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    return {
      id: `https://${this.domain}/ap/posts/${post.id}`,
      type: 'Note',
      attributedTo: `https://${this.domain}/ap/users/${handle}`,
      content: `<p>${this.escapeHtml(plainText)}</p>`,
      contentMap: { en: `<p>${this.escapeHtml(plainText)}</p>` },
      published: post.createdAt?.toISOString(),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [`https://${this.domain}/ap/users/${handle}/followers`],
      url: `https://${this.domain}/p/${post.id}`,
      ...(post.title ? { name: post.title } : {}),
    };
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
