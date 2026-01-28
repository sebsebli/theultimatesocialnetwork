import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly indexName = 'posts';

  constructor(private configService: ConfigService) {
    const host =
      this.configService.get<string>('MEILISEARCH_HOST') ||
      'http://localhost:7700';
    const apiKey =
      this.configService.get<string>('MEILISEARCH_MASTER_KEY') || 'masterKey';

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
      await index.updateFilterableAttributes(['authorId', 'lang', 'createdAt']);
      await index.updateSortableAttributes([
        'createdAt',
        'quoteCount',
        'replyCount',
      ]);

      // Enable vector search (Meilisearch v1.6+)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await (index as any).updateSettings({
        embedders: {
          default: {
            source: 'userProvided',
            dimensions: 384, // MiniLM-L6-v2 dimensions
          },
        },
      });
    } catch (error) {
      // Index might already exist or feature already enabled
      const message = error instanceof Error ? error.message : String(error);
      console.log('Meilisearch index setup:', message);
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
    embedding?: number[];
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
          _vectors: post.embedding ? { default: post.embedding } : undefined,
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

  async searchSimilar(vector: number[], limit = 20, filter?: string) {
    try {
      const index = this.client.index(this.indexName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const results = await (index as any).search('', {
        vector: vector,
        limit,
        filter,
      });
      return results as { hits: Record<string, any>[] };
    } catch (error) {
      console.error('Meilisearch vector search error', error);
      return { hits: [] };
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
