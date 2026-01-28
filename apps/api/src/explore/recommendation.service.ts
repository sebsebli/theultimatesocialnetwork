import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';

// Define the shape of user exploration preferences
interface ExplorePreferences {
  topicsYouFollow?: number;
  languageMatch?: number;
  citations?: number;
  replies?: number;
  likes?: number;
  networkProximity?: number;
}

/**
 * AI-powered recommendation service
 * Uses embeddings for content similarity and personalization
 */
@Injectable()
export class RecommendationService implements OnModuleInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private embeddingModel: any = null;
  private isModelLoaded = false;

  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
  ) {}

  onModuleInit() {
    // Load embedding model asynchronously (don't block startup)
    void this.loadEmbeddingModel().catch((err: Error) => {
      console.warn(
        'Failed to load embedding model, recommendations will use fallback:',
        err.message,
      );
    });
  }

  /**
   * Load embedding model (Xenova Transformers - runs locally)
   */
  private async loadEmbeddingModel() {
    try {
      // Lazy import to avoid startup crashes if native deps are missing
      const { pipeline } = await import('@xenova/transformers');
      // Use a lightweight sentence transformer model
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2', // Fast, lightweight model
      );
      this.isModelLoaded = true;
      console.log('✅ Embedding model loaded for recommendations');
    } catch (error) {
      console.warn('Could not load embedding model:', error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isModelLoaded || !this.embeddingModel) {
      return null;
    }

    try {
      // Clean text (remove markdown, wikilinks)
      const cleanText = text
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/#+\s*/g, '')
        .trim()
        .substring(0, 512); // Limit length

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const output = await this.embeddingModel(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Get user's interest profile based on their activity
   */
  private async getUserInterestProfile(userId: string): Promise<{
    topics: string[];
    likedPosts: Post[];
    keptPosts: Post[];
    followedUsers: string[];
  }> {
    // Get topics user has posted about
    const userPosts = await this.postRepo.find({
      where: { authorId: userId },
      take: 50,
    });

    const topics = new Set<string>();
    for (const post of userPosts) {
      const postTopics = await this.postTopicRepo.find({
        where: { postId: post.id },
      });
      for (const pt of postTopics) {
        topics.add(pt.topicId);
      }
    }

    // Get posts user has liked
    const likes = await this.likeRepo.find({
      where: { userId },
      take: 50,
    });
    const likedPostIds = likes.map((l) => l.postId);
    const likedPosts =
      likedPostIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(likedPostIds) },
            relations: ['author'],
          })
        : [];

    // Get posts user has kept
    const keeps = await this.keepRepo.find({
      where: { userId },
      take: 50,
    });
    const keptPostIds = keeps.map((k) => k.postId);
    const keptPosts =
      keptPostIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(keptPostIds) },
            relations: ['author'],
          })
        : [];

    // Get followed users
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followedUsers = follows.map((f) => f.followeeId);

    return {
      topics: Array.from(topics),
      likedPosts,
      keptPosts,
      followedUsers,
    };
  }

  /**
   * Get personalized post recommendations for user
   */
  async getRecommendedPosts(userId: string, limit = 20): Promise<Post[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const prefs = (user?.preferences?.explore || {
      topicsYouFollow: 80,
      languageMatch: 70,
      citations: 90,
      replies: 50,
      likes: 30, // Affects embedding influence
      networkProximity: 40,
    }) as ExplorePreferences;

    // Normalize weights (0-100 -> 0-1)
    const w = {
      topics: (prefs.topicsYouFollow ?? 80) / 100,
      lang: (prefs.languageMatch ?? 70) / 100,
      quotes: (prefs.citations ?? 90) / 100,
      replies: (prefs.replies ?? 50) / 100,
      likes: (prefs.likes ?? 30) / 100,
      network: (prefs.networkProximity ?? 40) / 100,
    };

    const userProfile = await this.getUserInterestProfile(userId);

    if (
      userProfile.likedPosts.length === 0 &&
      userProfile.keptPosts.length === 0
    ) {
      // New user - return trending posts
      return this.getTrendingPosts(limit);
    }

    // Generate embeddings for user's interests
    const interestTexts = userProfile.likedPosts
      .concat(userProfile.keptPosts)
      .map((p) => `${p.title || ''} ${p.body}`.trim())
      .slice(0, 10); // Use top 10 for efficiency

    if (interestTexts.length === 0 || !this.isModelLoaded) {
      // Fallback: return posts from followed users or trending
      return this.getFallbackRecommendations(
        userId,
        userProfile.followedUsers,
        limit,
      );
    }

    // Generate average embedding for user interests
    const embeddings = await Promise.all(
      interestTexts.map((text) => this.generateEmbedding(text)),
    );
    const validEmbeddings = embeddings.filter((e) => e !== null) as number[][];

    if (validEmbeddings.length === 0) {
      return this.getFallbackRecommendations(
        userId,
        userProfile.followedUsers,
        limit,
      );
    }

    // Average embeddings
    const avgEmbedding = new Array(validEmbeddings[0].length).fill(0) as number[];
    for (const emb of validEmbeddings) {
      for (let i = 0; i < emb.length; i++) {
        avgEmbedding[i] += emb[i];
      }
    }
    for (let i = 0; i < avgEmbedding.length; i++) {
      avgEmbedding[i] /= validEmbeddings.length;
    }

    // Get candidate posts (not from user, not deleted, public)
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.author_id != :userId', { userId })
      .andWhere('post.visibility = :visibility', { visibility: 'PUBLIC' })
      .andWhere('post.deleted_at IS NULL');

    // Strict language filtering if preference is very high
    if (w.lang > 0.8 && user?.languages?.length) {
      query.andWhere('post.lang IN (:...langs)', { langs: user.languages });
    }

    const candidatePosts = await query
      .orderBy('post.created_at', 'DESC')
      .take(200)
      .getMany();

    // Score posts by similarity
    const scoredPosts = await Promise.all(
      candidatePosts.map(async (post) => {
        const postText = `${post.title || ''} ${post.body}`.trim();
        const postEmbedding = await this.generateEmbedding(postText);

        if (!postEmbedding) {
          return { post, score: 0 };
        }

        // Base similarity (content match) - weighted by 'likes' preference (proxy for "content I like")
        const similarity =
          this.cosineSimilarity(avgEmbedding, postEmbedding) *
          (0.5 + 0.5 * w.likes);

        // Network boost
        const followBoost = userProfile.followedUsers.includes(post.authorId)
          ? 0.3 * w.network
          : 0;

        // Topic boost
        const postTopics = await this.postTopicRepo.find({
          where: { postId: post.id },
        });
        const topicBoost = postTopics.some((pt) =>
          userProfile.topics.includes(pt.topicId),
        )
          ? 0.3 * w.topics
          : 0;

        // Engagement boosts (normalize counts roughly)
        const quoteBoost =
          (Math.min(post.quoteCount, 10) / 10) * (0.2 * w.quotes);
        const replyBoost =
          (Math.min(post.replyCount, 20) / 20) * (0.1 * w.replies);

        // Language soft boost (if not strict filtered)
        let langBoost = 0;
        if (user?.languages?.includes(post.lang || '')) {
          langBoost = 0.1 * w.lang;
        }

        return {
          post,
          score:
            similarity +
            followBoost +
            topicBoost +
            quoteBoost +
            replyBoost +
            langBoost,
        };
      }),
    );

    // Sort by score and return top posts
    scoredPosts.sort((a, b) => b.score - a.score);
    return scoredPosts.slice(0, limit).map((sp) => sp.post);
  }

  /**
   * Get trending posts (fallback for new users)
   */
  private async getTrendingPosts(limit: number): Promise<Post[]> {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.visibility = :visibility', { visibility: 'PUBLIC' })
      .andWhere('post.deleted_at IS NULL')
      .orderBy('post.quote_count', 'DESC')
      .addOrderBy('post.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get fallback recommendations (when embeddings not available)
   */
  private async getFallbackRecommendations(
    userId: string,
    followedUsers: string[],
    limit: number,
  ): Promise<Post[]> {
    // Prioritize posts from followed users
    if (followedUsers.length > 0) {
      const followedPosts = await this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.author_id IN (:...userIds)', { userIds: followedUsers })
        .andWhere('post.visibility = :visibility', { visibility: 'PUBLIC' })
        .andWhere('post.deleted_at IS NULL')
        .orderBy('post.created_at', 'DESC')
        .take(limit)
        .getMany();

      if (followedPosts.length >= limit) {
        return followedPosts;
      }

      // Fill remaining with trending
      const remaining = limit - followedPosts.length;
      const trending = await this.getTrendingPosts(remaining);
      return followedPosts.concat(trending);
    }

    return this.getTrendingPosts(limit);
  }

  /**
   * Get personalized people recommendations
   */
  async getRecommendedPeople(userId: string, limit = 20): Promise<User[]> {
    const userProfile = await this.getUserInterestProfile(userId);

    // Find users who post about similar topics
    const similarUsers = await this.postTopicRepo
      .createQueryBuilder('pt')
      .innerJoin('posts', 'p', 'p.id = pt.post_id')
      .where('pt.topic_id IN (:...topics)', { topics: userProfile.topics })
      .andWhere('p.author_id != :userId', { userId })
      .andWhere('p.deleted_at IS NULL')
      .select('p.author_id', 'authorId')
      .addSelect('COUNT(*)', 'topicOverlap')
      .groupBy('p.author_id')
      .orderBy('topicOverlap', 'DESC')
      .limit(limit * 2)
      .getRawMany();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    const candidateUserIds = similarUsers.map((su) => su.authorId) as string[];

    if (candidateUserIds.length === 0) {
      // Fallback: return users with most followers
      return this.userRepo
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId })
        .orderBy('user.follower_count', 'DESC')
        .take(limit)
        .getMany();
    }

    // Get full user objects
    const users = await this.userRepo.find({
      where: { id: In(candidateUserIds) },
    });

    // Sort by topic overlap
    const userMap = new Map(users.map((u) => [u.id, u]));
    const sortedUsers = similarUsers
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .map((su) => userMap.get(su.authorId as string))
      .filter((u) => u !== undefined)
      .slice(0, limit);

    return sortedUsers as User[];
  }
}