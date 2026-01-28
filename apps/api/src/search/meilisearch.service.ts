import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly indexName = 'posts';

  constructor(private configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const host = this.configService.get('MEILISEARCH_HOST') || 'http://localhost:7700';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const apiKey = this.configService.get('MEILISEARCH_MASTER_KEY') || 'masterKey';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    try {
      // Create index if it doesn't exist
      await this.client.createIndex(this.indexName, { primaryKey: 'id' });

      // Configure searchable attributes
      const index = this.client.index(this.indexName);
      await index.updateSearchableAttributes([
        'title',
        'body',
        'author.displayName',
        'author.handle',
      ]);
      await index.updateFilterableAttributes([
        'authorId',
        'lang',
        'createdAt',
      ]);
      await index.updateSortableAttributes([
        'createdAt',
        'quoteCount',
        'replyCount',
      ]);
    } catch (error: unknown) {
      // Index might already exist, which is fine
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Meilisearch index setup:', (error as any).message);
    }
  }

  async indexUser(user: {
    id: string;
    handle: string;
    displayName: string;
    bio?: string;
  }) {
    try {
      const index = this.client.index('users');
      // Create index if it doesn't exist (lazy creation)
      // await this.client.createIndex('users', { primaryKey: 'id' });

      await index.addDocuments([
        {
          id: user.id,
          handle: user.handle,
          displayName: user.displayName,
          bio: user.bio || '',
        },
      ]);
    } catch (error) {
      console.error('Failed to index user', error);
    }
  }

  async deleteUser(userId: string) {
    try {
      const index = this.client.index('users');
      await index.deleteDocument(userId);
    } catch (error) {
      console.error('Failed to delete user from index', error);
    }
  }

  async indexTopic(topic: { id: string; slug: string; title: string }) {
    try {
      const index = this.client.index('topics');
      await index.addDocuments([
        {
          id: topic.id,
          slug: topic.slug,
          title: topic.title,
        },
      ]);
    } catch (error) {
      console.error('Failed to index topic', error);
    }
  }

  async indexPost(post: {
    id: string;
    title?: string | null;
    body: string;
    authorId: string;
    author?: { displayName?: string; handle: string } | null;
    lang?: string | null;
    createdAt: Date;
    quoteCount: number;
    replyCount: number;
  }) {
    try {
      const index = this.client.index(this.indexName);

      // Clean body of excessive whitespace/markdown for better search
      const searchBody = post.body.substring(0, 5000);

      await index.addDocuments([
        {
          id: post.id,
          title: post.title || '',
          body: searchBody,
          authorId: post.authorId,
          author: post.author
            ? {
                displayName: post.author.displayName || post.author.handle,
                handle: post.author.handle,
              }
            : { displayName: 'Unknown', handle: 'unknown' },
          lang: post.lang || 'en',
          createdAt: post.createdAt.toISOString(),
          quoteCount: post.quoteCount,
          replyCount: post.replyCount,
        },
      ]);
    } catch (error) {
      console.error('Failed to index post in Meilisearch', error);
    }
  }

  async searchPosts(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      lang?: string;
    },
  ) {
    try {
      const index = this.client.index(this.indexName);
      const results = await index.search(query, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        filter: options?.lang ? `lang = ${options.lang}` : undefined,
        sort: ['quoteCount:desc', 'createdAt:desc'],
      });
      return results;
    } catch (error) {
      console.error('Meilisearch search error', error);
      return { hits: [], estimatedTotalHits: 0 };
    }
  }

  async searchUsers(query: string, limit = 10) {
    try {
      // In a real app, ensure 'users' index exists
      const index = this.client.index('users');
      return await index.search(query, { limit });
    } catch (error) {
      console.error('Meilisearch user search error', error);
      return { hits: [] };
    }
  }

  async searchTopics(query: string, limit = 10) {
    try {
      const index = this.client.index('topics');
      return await index.search(query, { limit });
    } catch {
      // Topics might not be indexed yet, return empty
      // console.error('Meilisearch topic search error', error);
      return { hits: [] };
    }
  }

  async deletePost(postId: string) {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(postId);
    } catch (error) {
      console.error('Failed to delete post from Meilisearch', error);
    }
  }
}