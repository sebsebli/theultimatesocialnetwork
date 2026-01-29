import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { Collection } from '../entities/collection.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { postToPlain, replyToPlain } from '../shared/post-serializer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(PostRead) private readRepo: Repository<PostRead>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    private meilisearch: MeilisearchService,
  ) {}

  async isHandleAvailable(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const normalized = (handle || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (normalized.length < 3 || normalized.length > 30) return false;
    const existing = await this.userRepo.findOne({
      where: { handle: normalized },
    });
    if (!existing) return true;
    return !!excludeUserId && existing.id === excludeUserId;
  }

  async findByHandle(handle: string) {
    const user = await this.userRepo.findOne({
      where: { handle },
    });

    if (!user) return null;

    // Get posts with single optimized query
    const posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { ...user, posts };
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) return null;

    const posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { ...user, posts };
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    // Check username change limit
    if (updates.handle) {
      const user = await this.userRepo.findOneOrFail({ where: { id } });
      if (user.lastUsernameChangeAt) {
        const daysSinceChange =
          (Date.now() - user.lastUsernameChangeAt.getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSinceChange < 14) {
          throw new BadRequestException(
            'Username can only be changed once every 14 days.',
          );
        }
      }
      updates.lastUsernameChangeAt = new Date();
    }

    await this.userRepo.update(id, updates);
    const updatedUser = await this.userRepo.findOneOrFail({ where: { id } });
    this.meilisearch
      .indexUser(updatedUser)
      .catch((err) => console.error('Failed to update user index', err));
    return updatedUser;
  }

  /**
   * Suggested users to follow.
   * When userId is provided: returns people that the user's followers follow (second-degree),
   * ordered by how many of the user's followers follow them. Excludes self and people already followed.
   * When userId is not provided: returns globally popular users (by follower count).
   */
  async getSuggested(userId?: string, limit = 10) {
    if (userId) {
      const qb = this.followRepo
        .createQueryBuilder('f')
        .select('f.followee_id', 'id')
        .addSelect('COUNT(*)', 'cnt')
        .where(
          `f.follower_id IN (SELECT follower_id FROM follows WHERE followee_id = :userId)`,
          { userId },
        )
        .andWhere('f.followee_id != :userId', { userId })
        .andWhere(
          `f.followee_id NOT IN (SELECT followee_id FROM follows WHERE follower_id = :userId)`,
          { userId },
        )
        .groupBy('f.followee_id')
        .orderBy('cnt', 'DESC')
        .limit(limit);
      const rawRows = await qb.getRawMany<{ id: string; cnt: string }>();
      const rows = rawRows ?? [];
      if (rows.length === 0) {
        return this.getSuggestedFallback(limit);
      }
      const ids: string[] = rows.map((r) => r.id);
      const users = await this.userRepo.find({ where: { id: In(ids) } });
      const byId = new Map<string, User>(users.map((u) => [u.id, u]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter((u): u is User => u != null);
      return ordered;
    }
    return this.getSuggestedFallback(limit);
  }

  private async getSuggestedFallback(limit: number) {
    return this.userRepo.find({
      order: { followerCount: 'DESC' },
      take: limit,
    });
  }

  async getUserPosts(
    userId: string,
    page: number,
    limit: number,
    type: 'posts' | 'replies' | 'quotes' = 'posts',
  ): Promise<{ items: unknown[]; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    if (type === 'posts') {
      const posts = await this.postRepo.find({
        where: { authorId: userId, deletedAt: IsNull() },
        relations: ['author'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit + 1,
      });
      const hasMore = posts.length > limit;
      const items = posts.slice(0, limit).map((p) => postToPlain(p));
      return { items, hasMore };
    }
    if (type === 'replies') {
      const replies = await this.replyRepo.find({
        where: { authorId: userId },
        relations: ['post', 'post.author'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit + 1,
      });
      const hasMore = replies.length > limit;
      const items = replies.slice(0, limit).map((r) => replyToPlain(r));
      return { items, hasMore };
    }
    // type === 'quotes'
    const quotes = await this.postRepo
      .createQueryBuilder('quoter')
      .innerJoin(PostEdge, 'edge', 'edge.from_post_id = quoter.id')
      .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('quoted.author_id = :userId', { userId })
      .leftJoinAndSelect('quoter.author', 'author')
      .orderBy('quoter.created_at', 'DESC')
      .skip(skip)
      .take(limit + 1)
      .getMany();
    const hasMore = quotes.length > limit;
    const items = quotes.slice(0, limit);
    return { items: items.map((p) => postToPlain(p)), hasMore };
  }

  async getReplies(userId: string) {
    return this.replyRepo.find({
      where: { authorId: userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getQuotes(userId: string) {
    // Find posts that QUOTE posts authored by userId.
    // We join Post (quoter) -> PostEdge (QUOTE) -> Post (quoted)
    // Where quoted.authorId = userId

    return this.postRepo
      .createQueryBuilder('quoter')
      .innerJoin(PostEdge, 'edge', 'edge.from_post_id = quoter.id')
      .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('quoted.author_id = :userId', { userId })
      .leftJoinAndSelect('quoter.author', 'author')
      .orderBy('quoter.created_at', 'DESC')
      .take(20)
      .getMany();
  }

  async deleteUser(userId: string) {
    // Soft delete user
    await this.userRepo.softDelete(userId);
    // Soft delete all posts by user
    await this.postRepo.softDelete({ authorId: userId });

    // Remove from search
    this.meilisearch
      .deleteUser(userId)
      .catch((err) => console.error('Failed to remove user from index', err));

    return { success: true };
  }

  async exportUserData(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const posts = await this.postRepo.find({ where: { authorId: userId } });
    const replies = await this.replyRepo.find({ where: { authorId: userId } });
    const likes = await this.likeRepo.find({ where: { userId } });
    const keeps = await this.keepRepo.find({ where: { userId } });
    const following = await this.followRepo.find({
      where: { followerId: userId },
    });
    const followers = await this.followRepo.find({
      where: { followeeId: userId },
    });
    const reads = await this.readRepo.find({ where: { userId } });
    const notifications = await this.notifRepo.find({ where: { userId } });

    return {
      user,
      posts,
      replies,
      likes,
      keeps,
      following,
      followers,
      readHistory: reads,
      notifications,
      exportedAt: new Date(),
    };
  }

  /** Resolve handle or UUID to user id. Returns null if not found. */
  async resolveUserId(idOrHandle: string): Promise<string | null> {
    if (!idOrHandle) return null;
    const user = await this.userRepo.findOne({
      where: [{ id: idOrHandle }, { handle: idOrHandle }],
      select: ['id'],
    });
    return user?.id ?? null;
  }

  /** Public collections by owner (isPublic = true), paginated. */
  async getUserPublicCollections(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Partial<Collection>[]; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    const [collections] = await this.collectionRepo.findAndCount({
      where: { ownerId, isPublic: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit + 1,
    });
    const items = collections.slice(0, limit).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      isPublic: c.isPublic,
      createdAt: c.createdAt,
      ownerId: c.ownerId,
    }));
    return { items, hasMore: collections.length > limit };
  }

  async getFollowing(userId: string) {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['followee'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.followee);
  }

  async getFollowers(userId: string) {
    const follows = await this.followRepo.find({
      where: { followeeId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.follower);
  }

  async removeFollower(userId: string, followerId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followeeId: userId },
    });
    if (follow) {
      await this.followRepo.remove(follow);
      await this.userRepo.decrement({ id: userId }, 'followerCount', 1);
      await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
    }
    return { success: true };
  }
}
