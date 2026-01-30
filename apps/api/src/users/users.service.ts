import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { Collection } from '../entities/collection.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { AccountDeletionRequest } from '../entities/account-deletion-request.entity';
import { DataExport } from '../entities/data-export.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { CollectionsService } from '../collections/collections.service';
import { EmailService } from '../shared/email.service';
import { postToPlain, replyToPlain } from '../shared/post-serializer';

const QUOTES_BADGE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class UsersService {
  private quotesBadgeThresholdCache: { value: number; at: number } | null =
    null;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(PostEdge) private postEdgeRepo: Repository<PostEdge>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(ReplyLike) private replyLikeRepo: Repository<ReplyLike>,
    @InjectRepository(Keep) private keepRepo: Repository<Keep>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(PostRead) private readRepo: Repository<PostRead>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(NotificationPref)
    private notifPrefRepo: Repository<NotificationPref>,
    @InjectRepository(AccountDeletionRequest)
    private deletionRequestRepo: Repository<AccountDeletionRequest>,
    @InjectRepository(DataExport)
    private dataExportRepo: Repository<DataExport>,
    private meilisearch: MeilisearchService,
    private collectionsService: CollectionsService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Minimum quote_received_count to be in the top 10% most-quoted users.
   * Cached for QUOTES_BADGE_CACHE_TTL_MS. Used to show the quotes verified badge only for top 10%.
   */
  async getQuotesBadgeThreshold(): Promise<number> {
    const now = Date.now();
    if (
      this.quotesBadgeThresholdCache &&
      now - this.quotesBadgeThresholdCache.at < QUOTES_BADGE_CACHE_TTL_MS
    ) {
      return this.quotesBadgeThresholdCache.value;
    }
    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.quote_received_count > 0')
      .andWhere('u.deleted_at IS NULL');
    const total = await qb.getCount();
    if (total === 0) {
      this.quotesBadgeThresholdCache = { value: Infinity, at: now };
      return Infinity;
    }
    const offset = Math.max(0, Math.ceil(total * 0.1) - 1);
    const row = await this.userRepo
      .createQueryBuilder('u')
      .select('u.quote_received_count', 'count')
      .where('u.quote_received_count > 0')
      .andWhere('u.deleted_at IS NULL')
      .orderBy('u.quote_received_count', 'DESC')
      .offset(offset)
      .limit(1)
      .getRawOne<{ count: string }>();
    const value = row?.count != null ? Number(row.count) : Infinity;
    this.quotesBadgeThresholdCache = { value, at: now };
    return value;
  }

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
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    const isPlaceholder = user.handle?.startsWith('__pending_');

    // Check username change limit only when handle is actually changing (skip for onboarding placeholder → real)
    if (updates.handle != null && updates.handle !== user.handle) {
      if (!isPlaceholder && user.lastUsernameChangeAt) {
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

    // When completing profile from placeholder, mark onboarding complete
    if (
      isPlaceholder &&
      (updates.handle != null || updates.displayName != null)
    ) {
      const newHandle = (updates.handle ?? user.handle ?? '').trim();
      const newDisplayName = (
        updates.displayName ??
        user.displayName ??
        ''
      ).trim();
      if (
        newHandle &&
        !newHandle.startsWith('__pending_') &&
        newDisplayName &&
        newDisplayName !== 'Pending'
      ) {
        updates.onboardingCompletedAt = new Date();
      }
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
   * Uses multiple signals: second-degree follows, co-likers (same posts), co-quoters (quoted same posts), co-reply-likers.
   * Excludes self and people already followed. Merges and deduplicates by relevance.
   */
  async getSuggested(userId?: string, limit = 10) {
    if (!userId) {
      return this.getSuggestedFallback(limit);
    }

    const excludeSelfAndFollowed = async (candidateIds: string[]) => {
      const followed = await this.followRepo.find({
        where: { followerId: userId },
        select: ['followeeId'],
      });
      const followedSet = new Set(followed.map((f) => f.followeeId));
      return candidateIds.filter((id) => id !== userId && !followedSet.has(id));
    };

    const scored = new Map<string, number>();

    // 1) Second-degree: users that my followers follow (weight 3)
    const secondDegree = await this.followRepo
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
      .getRawMany<{ id: string; cnt: string }>();
    for (const r of secondDegree ?? []) {
      scored.set(
        r.id,
        (scored.get(r.id) ?? 0) + 3 * parseInt(r.cnt || '1', 10),
      );
    }

    // 2) Co-likers: users who liked the same posts I liked (weight 2)
    const myLikes = await this.likeRepo.find({
      where: { userId },
      take: 100,
      select: ['postId'],
    });
    const myLikedPostIds = myLikes.map((l) => l.postId);
    if (myLikedPostIds.length > 0) {
      const coLikers = await this.likeRepo
        .createQueryBuilder('l')
        .select('l.user_id', 'id')
        .addSelect('COUNT(*)', 'cnt')
        .where('l.post_id IN (:...ids)', { ids: myLikedPostIds })
        .andWhere('l.user_id != :userId', { userId })
        .groupBy('l.user_id')
        .getRawMany<{ id: string; cnt: string }>();
      for (const r of coLikers ?? []) {
        scored.set(
          r.id,
          (scored.get(r.id) ?? 0) + 2 * parseInt(r.cnt || '1', 10),
        );
      }
    }

    // 3) Co-quoters: users who quoted the same posts I quoted (or that quoted posts I authored)
    const myPostIds = await this.postRepo.find({
      where: { authorId: userId },
      select: ['id'],
      take: 200,
    });
    const myPostIdList = myPostIds.map((p) => p.id);
    if (myPostIdList.length > 0) {
      const quoters = await this.postEdgeRepo
        .createQueryBuilder('e')
        .select('quoter.author_id', 'id')
        .addSelect('COUNT(*)', 'cnt')
        .innerJoin('posts', 'quoter', 'quoter.id = e.from_post_id')
        .where('e.to_post_id IN (:...ids)', { ids: myPostIdList })
        .andWhere('e.edge_type = :type', { type: EdgeType.QUOTE })
        .andWhere('quoter.author_id != :userId', { userId })
        .groupBy('quoter.author_id')
        .getRawMany<{ id: string; cnt: string }>()
        .catch(() => []);
      for (const r of quoters ?? []) {
        scored.set(
          r.id,
          (scored.get(r.id) ?? 0) + 2 * parseInt(r.cnt || '1', 10),
        );
      }
    }

    // 4) Co-reply-likers: users who liked the same comments I liked (weight 1)
    const myReplyLikes = await this.replyLikeRepo.find({
      where: { userId },
      take: 100,
      select: ['replyId'],
    });
    const myLikedReplyIds = myReplyLikes.map((l) => l.replyId);
    if (myLikedReplyIds.length > 0) {
      const coReplyLikers = await this.replyLikeRepo
        .createQueryBuilder('rl')
        .select('rl.user_id', 'id')
        .addSelect('COUNT(*)', 'cnt')
        .where('rl.reply_id IN (:...ids)', { ids: myLikedReplyIds })
        .andWhere('rl.user_id != :userId', { userId })
        .groupBy('rl.user_id')
        .getRawMany<{ id: string; cnt: string }>();
      for (const r of coReplyLikers ?? []) {
        scored.set(
          r.id,
          (scored.get(r.id) ?? 0) + 1 * parseInt(r.cnt || '1', 10),
        );
      }
    }

    const candidateIds = Array.from(scored.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit * 2);
    const filtered = await excludeSelfAndFollowed(candidateIds);
    const ids = filtered.slice(0, limit);
    if (ids.length === 0) {
      return this.getSuggestedFallback(limit);
    }
    const users = await this.userRepo.find({ where: { id: In(ids) } });
    const byId = new Map<string, User>(users.map((u) => [u.id, u]));
    return ids.map((id) => byId.get(id)).filter((u): u is User => u != null);
  }

  private async getSuggestedFallback(limit: number) {
    return this.userRepo.find({
      order: { followerCount: 'DESC' },
      take: limit,
    });
  }

  async getNotificationPrefs(userId: string) {
    let pref = await this.notifPrefRepo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.notifPrefRepo.create({
        userId,
        pushEnabled: true,
        replies: true,
        quotes: true,
        mentions: true,
        dms: true,
        follows: true,
        saves: false,
      });
      await this.notifPrefRepo.save(pref);
    }
    return {
      push_enabled: pref.pushEnabled,
      replies: pref.replies,
      quotes: pref.quotes,
      mentions: pref.mentions,
      dms: pref.dms,
      follows: pref.follows,
      saves: pref.saves,
    };
  }

  async updateNotificationPrefs(
    userId: string,
    updates: Partial<{
      push_enabled: boolean;
      replies: boolean;
      quotes: boolean;
      mentions: boolean;
      dms: boolean;
      follows: boolean;
      saves: boolean;
    }>,
  ) {
    let pref = await this.notifPrefRepo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.notifPrefRepo.create({ userId });
      await this.notifPrefRepo.save(pref);
    }
    if (updates.push_enabled !== undefined)
      pref.pushEnabled = updates.push_enabled;
    if (updates.replies !== undefined) pref.replies = updates.replies;
    if (updates.quotes !== undefined) pref.quotes = updates.quotes;
    if (updates.mentions !== undefined) pref.mentions = updates.mentions;
    if (updates.dms !== undefined) pref.dms = updates.dms;
    if (updates.follows !== undefined) pref.follows = updates.follows;
    if (updates.saves !== undefined) pref.saves = updates.saves;
    await this.notifPrefRepo.save(pref);
    return this.getNotificationPrefs(userId);
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
    // type === 'quotes': posts that quote posts authored by userId (same join pattern as getQuotes)
    const quoters = await this.postRepo
      .createQueryBuilder('quoter')
      .innerJoin(PostEdge, 'edge', 'edge.from_post_id = quoter.id')
      .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
      .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
      .andWhere('quoted.author_id = :userId', { userId })
      .andWhere('quoter.deleted_at IS NULL')
      .leftJoinAndSelect('quoter.author', 'author')
      .orderBy('quoter.created_at', 'DESC')
      .skip(skip)
      .take(limit + 1)
      .getMany();
    const hasMore = quoters.length > limit;
    const items = quoters.slice(0, limit).map((p) => postToPlain(p));
    return { items, hasMore };
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

  /** Soft-delete user and their posts. Used after confirmation or internally. */
  async deleteUser(userId: string) {
    await this.userRepo.softDelete(userId);
    await this.postRepo.softDelete({ authorId: userId });

    this.meilisearch
      .deleteUser(userId)
      .catch((err) => console.error('Failed to remove user from index', err));

    return { success: true };
  }

  /** Request account deletion: create token, store reason, send confirmation email. */
  async requestAccountDeletion(
    userId: string,
    email: string,
    reason: string | null = null,
    lang: string = 'en',
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Invalidate any existing pending request for this user
    await this.deletionRequestRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('consumed_at IS NULL')
      .execute();

    const req = AccountDeletionRequest.createForUser(userId, reason, 24);
    await this.deletionRequestRepo.save(req);

    // Prefer API_URL so the email link opens GET /users/confirm-deletion and shows HTML. Else use FRONTEND_URL for app page.
    const baseUrl =
      this.configService.get<string>('API_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      '';
    const path = this.configService.get<string>('API_URL')
      ? '/users/confirm-deletion'
      : '/confirm-account-deletion';
    const confirmUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}${path}?token=${req.token}`
      : '';
    await this.emailService.sendAccountDeletionConfirmation(
      email,
      confirmUrl,
      reason,
      lang,
    );

    return {
      message:
        'A confirmation link has been sent to your email. Click it within 24 hours to permanently delete your account.',
    };
  }

  /** Confirm account deletion with token from email link. Returns userId if successful. */
  async confirmAccountDeletion(token: string): Promise<{ success: true }> {
    const req = await this.deletionRequestRepo.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!req) {
      throw new BadRequestException('Invalid or expired confirmation link.');
    }
    if (req.consumedAt) {
      throw new BadRequestException('This link has already been used.');
    }
    if (new Date() > req.expiresAt) {
      throw new BadRequestException('This confirmation link has expired.');
    }

    req.consumedAt = new Date();
    await this.deletionRequestRepo.save(req);

    await this.deleteUser(req.userId);
    return { success: true };
  }

  /** Whether the user can request a new data export (rate limit: once per 24 hours). */
  async canRequestDataExport(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'lastExportRequestedAt'],
    });
    if (!user?.lastExportRequestedAt) return true;
    const elapsed = Date.now() - user.lastExportRequestedAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return elapsed >= twentyFourHours;
  }

  /** Record that the user requested a data export (call before enqueueing job). */
  async recordExportRequest(userId: string): Promise<void> {
    await this.userRepo.update(
      { id: userId },
      { lastExportRequestedAt: new Date() },
    );
  }

  /** Find a valid data export by token. Returns null if not found or expired. */
  async getExportByToken(token: string): Promise<DataExport | null> {
    const exp = await this.dataExportRepo.findOne({
      where: { token: token.trim() },
    });
    if (!exp || exp.expiresAt < new Date()) return null;
    return exp;
  }

  /** Create a data export record and return the token for the download link. */
  async createDataExport(userId: string, storageKey: string): Promise<string> {
    const exp = DataExport.createForUser(userId, storageKey, 7);
    await this.dataExportRepo.save(exp);
    return exp.token;
  }

  /** Remove export record after download (one-time link). */
  async deleteExport(id: string): Promise<void> {
    await this.dataExportRepo.delete({ id });
  }

  /** Gather all user data for export (GDPR data portability). */
  async exportUserData(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;
    const posts = await this.postRepo.find({
      where: { authorId: userId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
    const replies = await this.replyRepo.find({
      where: { authorId: userId },
      relations: ['author', 'post'],
      order: { createdAt: 'DESC' },
    });
    const likes = await this.likeRepo.find({ where: { userId } });
    const keeps = await this.keepRepo.find({ where: { userId } });
    const following = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['followee'],
    });
    const followers = await this.followRepo.find({
      where: { followeeId: userId },
      relations: ['follower'],
    });
    const reads = await this.readRepo.find({ where: { userId } });
    const notifications = await this.notifRepo.find({ where: { userId } });
    const collections = await this.collectionRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });
    const notificationPrefs = await this.notifPrefRepo.findOne({
      where: { userId },
    });

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
      collections,
      notificationPrefs: notificationPrefs ?? null,
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

  /** Whether the viewer can see the owner's collections (profile public, or viewer follows owner). */
  async canViewUserCollections(
    ownerId: string,
    viewerId: string | null,
  ): Promise<boolean> {
    const owner = await this.userRepo.findOne({
      where: { id: ownerId },
      select: ['id', 'isProtected'],
    });
    if (!owner) return false;
    if (!owner.isProtected) return true;
    if (!viewerId) return false;
    const follow = await this.followRepo.findOne({
      where: { followerId: viewerId, followeeId: ownerId },
    });
    return !!follow;
  }

  /** Collections visible to the viewer for this owner. Visibility follows profile: public profile → all collections; private profile → only for followers. */
  async getUserVisibleCollections(
    ownerId: string,
    viewerId: string | null,
    page: number,
    limit: number,
  ): Promise<{ items: Partial<Collection>[]; hasMore: boolean }> {
    const canView = await this.canViewUserCollections(ownerId, viewerId);
    if (!canView) {
      return { items: [], hasMore: false };
    }
    return this.getUserAllCollections(ownerId, page, limit);
  }

  /** All collections by owner (public + private). For profile owner viewing their own profile. */
  async getUserAllCollections(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Partial<Collection>[]; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    const collections = await this.collectionRepo
      .createQueryBuilder('c')
      .where('c.ownerId = :ownerId', { ownerId })
      .loadRelationCountAndMap('c.itemCount', 'c.items')
      .orderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(limit + 1)
      .getMany();
    const slice = collections.slice(0, limit);
    const ids = slice.map((c) => c.id);
    const previewMap = await this.collectionsService.getPreviewImageKeys(ids);
    type CollectionWithItemCount = (typeof slice)[number] & {
      itemCount?: number;
    };
    const items = slice.map((c: CollectionWithItemCount) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      isPublic: c.isPublic,
      createdAt: c.createdAt,
      ownerId: c.ownerId,
      itemCount: c.itemCount ?? 0,
      previewImageKey: previewMap[c.id] ?? null,
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
