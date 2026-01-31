import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import MeiliSearch from 'meilisearch';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { DmThread } from '../entities/dm-thread.entity';

const MESSAGES_INDEX = 'messages';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch;
  private readonly indexName = 'posts';

  constructor(
    private configService: ConfigService,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(DmMessage) private dmMessageRepo: Repository<DmMessage>,
    @InjectRepository(DmThread) private dmThreadRepo: Repository<DmThread>,
  ) {
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
      await index.updateFilterableAttributes([
        'authorId',
        'lang',
        'createdAt',
        'topicIds',
      ]);
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
      const message = error instanceof Error ? error.message : String(error);
      console.log('Meilisearch posts index setup:', message);
    }
    try {
      await this.client.createIndex('users', { primaryKey: 'id' });
      const usersIndex = this.client.index('users');
      await usersIndex.updateSearchableAttributes([
        'handle',
        'displayName',
        'bio',
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('Meilisearch users index setup:', message);
    }
    try {
      await this.client.createIndex('topics', { primaryKey: 'id' });
      const topicsIndex = this.client.index('topics');
      await topicsIndex.updateSearchableAttributes(['slug', 'title']);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('Meilisearch topics index setup:', message);
    }
    try {
      await this.client.createIndex(MESSAGES_INDEX, { primaryKey: 'id' });
      const messagesIndex = this.client.index(MESSAGES_INDEX);
      await messagesIndex.updateSearchableAttributes(['body']);
      await messagesIndex.updateFilterableAttributes([
        'participantIds',
        'threadId',
        'senderId',
      ]);
      await messagesIndex.updateSortableAttributes(['createdAt']);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.log('Meilisearch messages index setup: ' + message);
    }

    // Auto-reindex from PostgreSQL when posts index is empty (e.g. after restore or first deploy)
    const reindexOnEmpty =
      this.configService.get<string>('MEILISEARCH_REINDEX_ON_STARTUP') ===
      'true';
    try {
      const postsIndex = this.client.index(this.indexName);
      const stats = await postsIndex.getStats();
      const count = stats.numberOfDocuments ?? 0;
      if (count === 0 || reindexOnEmpty) {
        this.logger.log(
          reindexOnEmpty
            ? 'MEILISEARCH_REINDEX_ON_STARTUP=true: reindexing from PostgreSQL in background.'
            : 'Meilisearch posts index is empty: reindexing from PostgreSQL in background.',
        );
        void this.reindexFromPostgres().catch((err) =>
          this.logger.warn('Reindex from PostgreSQL failed:', err),
        );
      }
    } catch {
      // Ignore; index may not exist yet
    }
  }

  /** Batch sizes for reindex (configurable for scale). */
  private get reindexBatchSize(): number {
    const v = this.configService.get<string>('MEILISEARCH_REINDEX_BATCH_SIZE');
    const n = v ? parseInt(v, 10) : 1000;
    return Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : 1000;
  }

  private get reindexUserBatchSize(): number {
    const v = this.configService.get<string>(
      'MEILISEARCH_REINDEX_USER_BATCH_SIZE',
    );
    const n = v ? parseInt(v, 10) : 5000;
    return Number.isFinite(n) && n > 0 ? Math.min(n, 20000) : 5000;
  }

  /**
   * Reindex all users, topics, and posts from PostgreSQL.
   * Batched end-to-end so it scales to thousands of users and hundreds of thousands of posts
   * without loading everything into memory. Used automatically when the posts index is empty
   * (e.g. after full restore) or when MEILISEARCH_REINDEX_ON_STARTUP=true.
   */
  async reindexFromPostgres(): Promise<void> {
    this.logger.log('Reindex from PostgreSQL started (scalable batched mode).');
    try {
      // 1. Users in batches (no full load into memory)
      const usersIndex = this.client.index('users');
      let userOffset = 0;
      let totalUsers = 0;
      let users: {
        id: string;
        handle: string;
        displayName: string;
        bio: string | null;
      }[];
      do {
        users = await this.userRepo.find({
          where: {},
          select: ['id', 'handle', 'displayName', 'bio'],
          order: { handle: 'ASC' },
          skip: userOffset,
          take: this.reindexUserBatchSize,
        });
        if (users.length === 0) break;
        await usersIndex.addDocuments(
          users.map((u) => ({
            id: u.id,
            handle: u.handle,
            displayName: u.displayName,
            bio: u.bio ?? '',
          })),
        );
        totalUsers += users.length;
        if (users.length < this.reindexUserBatchSize) break;
        userOffset += this.reindexUserBatchSize;
        this.logger.log(`Reindex: ${totalUsers} users so far...`);
      } while (users.length >= this.reindexUserBatchSize);
      this.logger.log(`Reindex: ${totalUsers} users.`);

      // 2. Topics in batches (usually small; one batch is enough)
      const topicsIndex = this.client.index('topics');
      let topicOffset = 0;
      let totalTopics = 0;
      let topics: { id: string; slug: string; title: string }[];
      do {
        topics = await this.topicRepo.find({
          select: ['id', 'slug', 'title'],
          order: { slug: 'ASC' },
          skip: topicOffset,
          take: this.reindexBatchSize,
        });
        if (topics.length === 0) break;
        await topicsIndex.addDocuments(
          topics.map((t) => ({
            id: t.id,
            slug: t.slug,
            title: t.title,
          })),
        );
        totalTopics += topics.length;
        if (topics.length < this.reindexBatchSize) break;
        topicOffset += this.reindexBatchSize;
      } while (topics.length >= this.reindexBatchSize);
      this.logger.log(`Reindex: ${totalTopics} topics.`);

      // 3. Posts in batches; use relation author (no global user map)
      const postsIndex = this.client.index(this.indexName);
      let postOffset = 0;
      let totalPosts = 0;
      let posts: Post[];
      do {
        posts = await this.postRepo.find({
          where: {},
          relations: ['author', 'postTopics'],
          order: { createdAt: 'ASC' },
          skip: postOffset,
          take: this.reindexBatchSize,
        });
        if (posts.length === 0) break;
        const docs = posts.map((post) => {
          const author = post.author;
          const topicIds = post.postTopics?.map((pt) => pt.topicId) ?? [];
          const searchBody = post.body.substring(0, 5000);
          return {
            id: post.id,
            title: post.title || '',
            body: searchBody,
            authorId: post.authorId,
            author: author
              ? {
                  displayName: author.displayName ?? author.handle,
                  handle: author.handle,
                }
              : { displayName: 'Unknown', handle: 'unknown' },
            lang: post.lang ?? 'en',
            createdAt: post.createdAt.toISOString(),
            quoteCount: post.quoteCount,
            replyCount: post.replyCount,
            topicIds,
          };
        });
        await postsIndex.addDocuments(docs);
        totalPosts += posts.length;
        if (posts.length < this.reindexBatchSize) break;
        postOffset += this.reindexBatchSize;
        this.logger.log(`Reindex: ${totalPosts} posts so far...`);
      } while (posts.length >= this.reindexBatchSize);
      // 4. DM messages in batches (participantIds for secure search filter)
      const messagesIndex = this.client.index(MESSAGES_INDEX);
      let msgOffset = 0;
      let totalMessages = 0;
      let messages: DmMessage[];
      do {
        messages = await this.dmMessageRepo.find({
          where: {},
          relations: ['thread'],
          order: { createdAt: 'ASC' },
          skip: msgOffset,
          take: this.reindexBatchSize,
        });
        if (messages.length === 0) break;
        const msgDocs = messages
          .filter((m) => m.thread)
          .map((m) => ({
            id: m.id,
            threadId: m.threadId,
            senderId: m.senderId,
            body: (m.body ?? '').substring(0, 5000),
            createdAt: m.createdAt.toISOString(),
            participantIds: [m.thread.userA, m.thread.userB],
          }));
        if (msgDocs.length > 0) {
          await messagesIndex.addDocuments(msgDocs);
          totalMessages += msgDocs.length;
        }
        if (messages.length < this.reindexBatchSize) break;
        msgOffset += this.reindexBatchSize;
        this.logger.log(`Reindex: ${totalMessages} messages so far...`);
      } while (messages.length >= this.reindexBatchSize);
      if (totalMessages > 0) {
        this.logger.log(`Reindex: ${totalMessages} messages.`);
      }

      this.logger.log(
        `Reindex: ${totalUsers} users, ${totalTopics} topics, ${totalPosts} posts, ${totalMessages} messages. Reindex from PostgreSQL finished.`,
      );
    } catch (error) {
      this.logger.error('Reindex from PostgreSQL failed', error);
      throw error;
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
    topicIds?: string[];
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
          topicIds: post.topicIds ?? [],
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
      topicId?: string;
    },
  ) {
    try {
      const index = this.client.index(this.indexName);
      const filters: string[] = [];
      if (options?.lang) filters.push(`lang = "${options.lang}"`);
      if (options?.topicId) filters.push(`topicIds IN ["${options.topicId}"]`);
      const filter = filters.length > 0 ? filters.join(' AND ') : undefined;
      const results = await index.search(query, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        filter: filter || undefined,
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

  async searchUsers(query: string, limit = 20) {
    try {
      const index = this.client.index('users');
      const res = await index.search(query, { limit });
      return res;
    } catch (error) {
      console.error('Meilisearch user search error', error);
      return { hits: [], estimatedTotalHits: 0 };
    }
  }

  /** Dedupe by id (first occurrence wins). */
  private dedupeById<T extends { id?: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const id = item?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  async searchAll(query: string, limitPerType = 15) {
    const [postsRes, usersRes, topicsRes] = await Promise.all([
      this.searchPosts(query, { limit: limitPerType, offset: 0 }).catch(() => ({
        hits: [],
      })),
      this.searchUsers(query, limitPerType).then((r) => ({
        hits: r.hits || [],
      })),
      this.searchTopics(query, limitPerType).then((r) => ({
        hits: r.hits || [],
      })),
    ]);
    return {
      posts: this.dedupeById((postsRes.hits || []) as { id?: string }[]),
      users: this.dedupeById((usersRes.hits || []) as { id?: string }[]),
      topics: this.dedupeById((topicsRes.hits || []) as { id?: string }[]),
    };
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

  // --- DM messages (chat search): always filter by participantIds = userId for security ---

  /**
   * Index a single DM message. participantIds must be [thread.userA, thread.userB]
   * so search can filter by participantIds = currentUserId (server-side only).
   */
  async indexMessage(
    message: {
      id: string;
      threadId: string;
      senderId: string;
      body: string;
      createdAt: Date;
    },
    participantIds: [string, string],
  ): Promise<void> {
    try {
      const index = this.client.index(MESSAGES_INDEX);
      await index.addDocuments([
        {
          id: message.id,
          threadId: message.threadId,
          senderId: message.senderId,
          body: (message.body ?? '').substring(0, 5000),
          createdAt: message.createdAt.toISOString(),
          participantIds,
        },
      ]);
    } catch (error) {
      this.logger.warn('Failed to index message in Meilisearch', error);
    }
  }

  /**
   * Search DM messages. Security: userId is required and applied server-side only.
   * Only returns messages from threads where the user is a participant.
   */
  async searchMessages(
    query: string,
    userId: string,
    limit = 30,
  ): Promise<{
    hits: Array<{
      id: string;
      threadId: string;
      body: string;
      createdAt: string;
      senderId: string;
    }>;
  }> {
    if (!userId) {
      return { hits: [] };
    }
    try {
      const index = this.client.index(MESSAGES_INDEX);
      const res = await index.search(query.trim(), {
        limit,
        filter: `participantIds = "${userId}"`,
        sort: ['createdAt:desc'],
      });
      const hits = (res.hits ?? []).map((h: Record<string, unknown>) => ({
        id: h.id,
        threadId: h.threadId,
        body: h.body,
        createdAt: h.createdAt,
        senderId: h.senderId,
      }));
      return { hits };
    } catch (error) {
      this.logger.warn('Meilisearch message search error', error);
      return { hits: [] };
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const index = this.client.index(MESSAGES_INDEX);
      await index.deleteDocument(messageId);
    } catch (error) {
      this.logger.warn('Failed to delete message from Meilisearch', error);
    }
  }
}
