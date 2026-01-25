import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';

/**
 * AI-powered recommendation service
 * Uses embeddings for content similarity and personalization
 */
@Injectable()
export class RecommendationService implements OnModuleInit {
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

  async onModuleInit() {
    // Load embedding model asynchronously (don't block startup)
    this.loadEmbeddingModel().catch(err => {
      console.warn('Failed to load embedding model, recommendations will use fallback:', err.message);
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

      const output = await this.embeddingModel(cleanText, {
        pooling: 'mean',
        normalize: true,
      });

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
    const likedPostIds = likes.map(l => l.postId);
    const likedPosts = likedPostIds.length > 0
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
    const keptPostIds = keeps.map(k => k.postId);
    const keptPosts = keptPostIds.length > 0
      ? await this.postRepo.find({
          where: { id: In(keptPostIds) },
          relations: ['author'],
        })
      : [];

    // Get followed users
    const follows = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followedUsers = follows.map(f => f.followeeId);

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
    const userProfile = await this.getUserInterestProfile(userId);

    if (userProfile.likedPosts.length === 0 && userProfile.keptPosts.length === 0) {
      // New user - return trending posts
      return this.getTrendingPosts(limit);
    }

    // Generate embeddings for user's interests
    const interestTexts = userProfile.likedPosts
      .concat(userProfile.keptPosts)
      .map(p => `${p.title || ''} ${p.body}`.trim())
      .slice(0, 10); // Use top 10 for efficiency

    if (interestTexts.length === 0 || !this.isModelLoaded) {
      // Fallback: return posts from followed users or trending
      return this.getFallbackRecommendations(userId, userProfile.followedUsers, limit);
    }

    // Generate average embedding for user interests
    const embeddings = await Promise.all(
      interestTexts.map(text => this.generateEmbedding(text))
    );
    const validEmbeddings = embeddings.filter(e => e !== null) as number[][];

    if (validEmbeddings.length === 0) {
      return this.getFallbackRecommendations(userId, userProfile.followedUsers, limit);
    }

    // Average embeddings
    const avgEmbedding = new Array(validEmbeddings[0].length).fill(0);
    for (const emb of validEmbeddings) {
      for (let i = 0; i < emb.length; i++) {
        avgEmbedding[i] += emb[i];
      }
    }
    for (let i = 0; i < avgEmbedding.length; i++) {
      avgEmbedding[i] /= validEmbeddings.length;
    }

    // Get candidate posts (not from user, not deleted, public)
    const candidatePosts = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.author_id != :userId', { userId })
      .andWhere('post.visibility = :visibility', { visibility: 'PUBLIC' })
      .andWhere('post.deleted_at IS NULL')
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

        const similarity = this.cosineSimilarity(avgEmbedding, postEmbedding);
        
        // Boost score for posts from followed users
        const followBoost = userProfile.followedUsers.includes(post.authorId) ? 0.2 : 0;
        
        // Boost score for posts in user's topics
        const postTopics = await this.postTopicRepo.find({
          where: { postId: post.id },
        });
        const topicBoost = postTopics.some(pt => userProfile.topics.includes(pt.topicId)) ? 0.1 : 0;

        return {
          post,
          score: similarity + followBoost + topicBoost,
        };
      })
    );

    // Sort by score and return top posts
    scoredPosts.sort((a, b) => b.score - a.score);
    return scoredPosts.slice(0, limit).map(sp => sp.post);
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

    const candidateUserIds = similarUsers.map(su => su.authorId);

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
    const userMap = new Map(users.map(u => [u.id, u]));
    const sortedUsers = similarUsers
      .map(su => userMap.get(su.authorId))
      .filter(u => u !== undefined)
      .slice(0, limit);

    return sortedUsers;
  }
}
