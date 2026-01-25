import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly indexName = 'posts';

  constructor(private configService: ConfigService) {
    const host = this.configService.get('MEILISEARCH_HOST') || 'http://localhost:7700';
    const apiKey = this.configService.get('MEILISEARCH_MASTER_KEY') || 'masterKey';
    
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
      await index.updateSearchableAttributes(['title', 'body', 'author.displayName', 'author.handle']);
      await index.updateFilterableAttributes(['authorId', 'lang', 'createdAt']);
      await index.updateSortableAttributes(['createdAt', 'quoteCount', 'replyCount']);
    } catch (error) {
      // Index might already exist, which is fine
      console.log('Meilisearch index setup:', error.message);
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
      await index.addDocuments([
        {
          id: post.id,
          title: post.title || '',
          body: post.body,
          authorId: post.authorId,
          author: post.author ? {
            displayName: post.author.displayName,
            handle: post.author.handle,
          } : null,
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

  async searchPosts(query: string, options?: {
    limit?: number;
    offset?: number;
    lang?: string;
  }) {
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

  async deletePost(postId: string) {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(postId);
    } catch (error) {
      console.error('Failed to delete post from Meilisearch', error);
    }
  }
}
