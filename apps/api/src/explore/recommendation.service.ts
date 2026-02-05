import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository, In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { EmbeddingService } from '../shared/embedding.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { ExploreService } from './explore.service';

// Define the shape of user exploration preferences
interface ExplorePreferences {
  topicsYouFollow?: number;
  languageMatch?: number;
  citations?: number;
  replies?: number;
  likes?: number;
  networkProximity?: number;
  depth?: number; // Preference for long-form content (0-100)
}

/**
 * AI-powered recommendation service
 * Uses embeddings for content similarity and personalization
 */
interface UserInterestProfile {
  topics: string[];
  likedPosts: Post[];
  keptPosts: Post[];
  followedUsers: string[];
}

/**
 * AI-powered recommendation service
 * Uses embeddings for content similarity and personalization
 */
@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private embeddingService: EmbeddingService,
    private meilisearchService: MeilisearchService,
    private exploreService: ExploreService,
  ) {}

  /**
   * Get user's interest profile based on their activity
   */
  private async getUserInterestProfile(
    userId: string,
  ): Promise<UserInterestProfile> {
    // Check cache for profile
    const cacheKey = `user_interest_profile:${userId}`;
    let cachedProfile: UserInterestProfile | undefined;
    try {
      cachedProfile =
        await this.cacheManager.get<UserInterestProfile>(cacheKey);
    } catch (e) {
      console.warn('Cache get failed', e);
    }
    if (cachedProfile) {
      return cachedProfile;
    }

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

    const profile = {
      topics: Array.from(topics),
      likedPosts,
      keptPosts,
      followedUsers,
    };

    // Cache profile for 5 minutes
    try {
      await this.cacheManager.set(cacheKey, profile, 300000);
    } catch (e) {
      console.warn('Cache set failed', e);
    }

    return profile;
  }

  /**
   * Get personalized post recommendations for user
   */
  async getRecommendedPosts(userId: string, limit = 20): Promise<Post[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'preferences'],
    });
    const explore = user?.preferences?.explore as
      | Record<string, unknown>
      | undefined;
    if (explore?.recommendationsEnabled === false) {
      return this.getTrendingPosts(limit);
    }

    // Check cache for recommendations
    const cacheKey = `recs:posts:${userId}:${limit}`;
    let cachedRecs: Post[] | undefined;
    try {
      cachedRecs = await this.cacheManager.get<Post[]>(cacheKey);
    } catch (e) {
      console.warn('Cache get failed', e);
    }
    if (cachedRecs) {
      return cachedRecs;
    }

    const prefs = (user?.preferences?.explore || {
      topicsYouFollow: 80,
      languageMatch: 70,
      citations: 90,
      replies: 50,
      likes: 30, // Affects embedding influence
      networkProximity: 40,
      depth: 50, // Default balanced preference for length
    }) as ExplorePreferences;

    // Normalize weights (0-100 -> 0-1)
    const w = {
      topics: (prefs.topicsYouFollow ?? 80) / 100,
      lang: (prefs.languageMatch ?? 70) / 100,
      quotes: (prefs.citations ?? 90) / 100,
      replies: (prefs.replies ?? 50) / 100,
      likes: (prefs.likes ?? 30) / 100,
      network: (prefs.networkProximity ?? 40) / 100,
      depth: (prefs.depth ?? 50) / 100,
    };

    const userProfile = await this.getUserInterestProfile(userId);

    let resultPosts: Post[] = [];

    if (
      userProfile.likedPosts.length === 0 &&
      userProfile.keptPosts.length === 0
    ) {
      // New user - return trending posts
      resultPosts = await this.getTrendingPosts(limit);
    } else {
      // Generate user embedding from interests
      const interestTexts = userProfile.likedPosts
        .concat(userProfile.keptPosts)
        .map((p) => `${p.title || ''} ${p.body}`.trim())
        .slice(0, 5); // Use top 5 for speed

      let userVector: number[] | null = null;
      if (interestTexts.length > 0) {
        const text = interestTexts.join(' ').substring(0, 1000);
        userVector = await this.embeddingService.generateEmbedding(text);
      }

      if (!userVector) {
        // Fallback: return posts from followed users or trending
        resultPosts = await this.getFallbackRecommendations(
          userId,
          userProfile.followedUsers,
          limit,
        );
      } else {
        // Retrieve Candidates via Vector Search (Scalable)
        let langFilter: string | undefined;
        if (w.lang > 0.8 && user?.languages?.length) {
          langFilter = `lang IN [${user.languages
            .map((l) => `'${l}'`)
            .join(',')}]`;
        }

        const hits = await this.meilisearchService.searchSimilar(
          userVector,
          limit * 2, // Fetch candidates
          langFilter,
        );

        const postIds = hits.hits.map((h) => h.id as string);

        if (postIds.length === 0) {
          resultPosts = await this.getFallbackRecommendations(
            userId,
            userProfile.followedUsers,
            limit,
          );
        } else {
          // Re-hydrate posts
          const candidatePosts = await this.postRepo.find({
            where: { id: In(postIds) },
            relations: ['author'],
          });

          // Re-ranking (lightweight)
          // Map original rank to a score
          const rankMap = new Map<string, number>(
            postIds.map((id: string, index: number) => [id, index]),
          );

          const scoredPosts = await Promise.all(
            candidatePosts.map(async (post) => {
              const rank = rankMap.get(post.id) ?? 999;
              // Base score from vector rank (lower rank is better)
              const vectorScore = 1.0 / (rank + 1);

              // Network boost
              const followBoost =
                post.authorId &&
                userProfile.followedUsers.includes(post.authorId)
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

              // Engagement boosts
              const quoteBoost =
                (Math.min(post.quoteCount, 10) / 10) * (0.2 * w.quotes);
              const replyBoost =
                (Math.min(post.replyCount, 20) / 20) * (0.1 * w.replies);

              // Depth boost (reading time)
              // If w.depth > 0.5, we boost longer posts.
              // We'll scale the influence by 0.3 max score.
              const readingTime = post.readingTimeMinutes || 1;
              const lengthScore = Math.min(readingTime, 10) / 10; // 0.1 to 1.0
              const depthBoost = lengthScore * (0.3 * w.depth);

              // Language soft boost
              let langBoost = 0;
              if (user?.languages?.includes(post.lang || '')) {
                langBoost = 0.1 * w.lang;
              }

              return {
                post,
                score:
                  vectorScore +
                  followBoost +
                  topicBoost +
                  quoteBoost +
                  replyBoost +
                  depthBoost +
                  langBoost,
              };
            }),
          );

          scoredPosts.sort((a, b) => b.score - a.score);
          resultPosts = scoredPosts.slice(0, limit).map((sp) => sp.post);
        }
      }
    }

    // Enforce visibility from author profile: exclude posts from protected accounts unless viewer follows
    resultPosts = await this.exploreService.filterPostsVisibleToViewer(
      resultPosts,
      userId,
    );

    // Cache the results
    try {
      await this.cacheManager.set(cacheKey, resultPosts, 300000); // 5 min TTL
    } catch (e) {
      console.warn('Cache set failed', e);
    }

    return resultPosts;
  }

  /**
   * Get trending posts (fallback for new users). Excludes posts from protected accounts.
   */
  private async getTrendingPosts(limit: number): Promise<Post[]> {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .andWhere('post.deleted_at IS NULL')
      .andWhere('(author.is_protected = false OR author.is_protected IS NULL)')
      .orderBy('post.quoteCount', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
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
        .andWhere('post.deleted_at IS NULL')
        .orderBy('post.createdAt', 'DESC')
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
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'preferences'],
    });
    const explore = user?.preferences?.explore as
      | Record<string, unknown>
      | undefined;
    if (explore?.recommendationsEnabled === false) {
      const users = await this.userRepo
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId })
        .andWhere('user.is_protected = false')
        .orderBy('user.followerCount', 'DESC')
        .take(limit)
        .getMany();
      return users;
    }

    // Check cache
    const cacheKey = `recs:people:${userId}:${limit}`;
    let cachedRecs: User[] | undefined;
    try {
      cachedRecs = await this.cacheManager.get<User[]>(cacheKey);
    } catch (e) {
      console.warn('Cache get failed', e);
    }
    if (cachedRecs) {
      return cachedRecs;
    }

    const userProfile = await this.getUserInterestProfile(userId);

    // Find users who post about similar topics (skip topic filter when user has no topics)
    let similarUsers: { authorId: string; topicOverlap: string }[] = [];
    if (userProfile.topics.length > 0) {
      similarUsers = await this.postTopicRepo
        .createQueryBuilder('pt')
        .innerJoin('posts', 'p', 'p.id = pt.post_id')
        .where('pt.topic_id IN (:...topics)', { topics: userProfile.topics })
        .andWhere('p.author_id != :userId', { userId })
        .andWhere('p.deleted_at IS NULL')
        .select('p.author_id', 'authorId')
        .addSelect('COUNT(*)', 'topicOverlap')
        .groupBy('p.author_id')
        .orderBy('COUNT(*)', 'DESC')
        .limit(limit * 2)
        .getRawMany<{ authorId: string; topicOverlap: string }>();
    }

    const candidateUserIds = similarUsers.map((su) => su.authorId);

    let resultUsers: User[];

    if (candidateUserIds.length === 0) {
      // Fallback: return users with most followers (exclude protected)
      resultUsers = await this.userRepo
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId })
        .andWhere('user.is_protected = false')
        .orderBy('user.followerCount', 'DESC')
        .take(limit)
        .getMany();
    } else {
      // Get full user objects
      const users = await this.userRepo.find({
        where: { id: In(candidateUserIds) },
        select: [
          'id',
          'handle',
          'displayName',
          'avatarKey',
          'isProtected',
          'followerCount',
          'followingCount',
        ],
      });

      // Sort by topic overlap
      const userMap = new Map(users.map((u) => [u.id, u]));
      resultUsers = similarUsers
        .map((su) => userMap.get(su.authorId))
        .filter((u): u is User => u !== undefined)
        .slice(0, limit * 2);
    }

    // Exclude protected users unless the viewer follows them
    const protectedUsers = resultUsers.filter(
      (u) => u.isProtected && u.id !== userId,
    );
    if (protectedUsers.length > 0) {
      const followees = await this.followRepo.find({
        where: {
          followerId: userId,
          followeeId: In(protectedUsers.map((u) => u.id)),
        },
        select: ['followeeId'],
      });
      const followingSet = new Set(followees.map((f) => f.followeeId));
      resultUsers = resultUsers.filter(
        (u) => !u.isProtected || u.id === userId || followingSet.has(u.id),
      );
    } else {
      resultUsers = resultUsers.filter(
        (u) => !u.isProtected || u.id === userId,
      );
    }
    resultUsers = resultUsers.slice(0, limit);

    // Cache
    try {
      await this.cacheManager.set(cacheKey, resultUsers, 300000);
    } catch (e) {
      console.warn('Cache set failed', e);
    }

    return resultUsers;
  }
}
