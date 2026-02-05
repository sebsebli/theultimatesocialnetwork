import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not, Like as TypeOrmLike } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Reply } from '../entities/reply.entity';
import { PostEdge, EdgeType } from '../entities/post-edge.entity';
import { Like } from '../entities/like.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Keep } from '../entities/keep.entity';
import { Follow } from '../entities/follow.entity';
import {
  FollowRequest,
  FollowRequestStatus,
} from '../entities/follow-request.entity';
import { PostRead } from '../entities/post-read.entity';
import { Notification } from '../entities/notification.entity';
import { Collection } from '../entities/collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';
import { NotificationPref } from '../entities/notification-pref.entity';
import { AccountDeletionRequest } from '../entities/account-deletion-request.entity';
import { EmailChangeRequest } from '../entities/email-change-request.entity';
import { DataExport } from '../entities/data-export.entity';
import { DmThread } from '../entities/dm-thread.entity';
import { DmMessage } from '../entities/dm-message.entity';
import { Block } from '../entities/block.entity';
import { Mute } from '../entities/mute.entity';
import { MeilisearchService } from '../search/meilisearch.service';
import { CollectionsService } from '../collections/collections.service';
import { EmailService } from '../shared/email.service';
import { UploadService } from '../upload/upload.service';
import { InteractionsService } from '../interactions/interactions.service';
import {
  postToPlain,
  replyToPlain,
  extractLinkedPostIds,
} from '../shared/post-serializer';
import { isPendingUser } from '../shared/is-pending-user';

const QUOTES_BADGE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Return id -> { title?, deletedAt? } for linked post display. Includes soft-deleted posts so clients can show "(deleted content)". Keys normalized to lowercase. */
async function getTitlesForPostIds(
  postRepo: Repository<Post>,
  ids: string[],
): Promise<Record<string, { title?: string; deletedAt?: string }>> {
  if (ids.length === 0) return {};
  const unique = Array.from(new Set(ids));
  const posts = await postRepo.find({
    where: unique.map((id) => ({ id })),
    select: ['id', 'title', 'deletedAt'],
    withDeleted: true,
  });
  const out: Record<string, { title?: string; deletedAt?: string }> = {};
  for (const p of posts) {
    const key = (p.id ?? '').toLowerCase();
    if (key) {
      out[key] = {
        title: p.title ?? undefined,
        deletedAt:
          p.deletedAt != null ? new Date(p.deletedAt).toISOString() : undefined,
      };
    }
  }
  return out;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
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
    @InjectRepository(FollowRequest)
    private followRequestRepo: Repository<FollowRequest>,
    @InjectRepository(PostRead) private readRepo: Repository<PostRead>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(Collection)
    private collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private collectionItemRepo: Repository<CollectionItem>,
    @InjectRepository(NotificationPref)
    private notifPrefRepo: Repository<NotificationPref>,
    @InjectRepository(AccountDeletionRequest)
    private deletionRequestRepo: Repository<AccountDeletionRequest>,
    @InjectRepository(EmailChangeRequest)
    private emailChangeRequestRepo: Repository<EmailChangeRequest>,
    @InjectRepository(DataExport)
    private dataExportRepo: Repository<DataExport>,
    @InjectRepository(DmThread) private dmThreadRepo: Repository<DmThread>,
    @InjectRepository(DmMessage) private dmMessageRepo: Repository<DmMessage>,
    @InjectRepository(Block) private blockRepo: Repository<Block>,
    @InjectRepository(Mute) private muteRepo: Repository<Mute>,
    private meilisearch: MeilisearchService,
    private collectionsService: CollectionsService,
    private emailService: EmailService,
    private configService: ConfigService,
    private uploadService: UploadService,
    private interactionsService: InteractionsService,
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

  async findByHandle(handle: string, viewerId?: string) {
    const user = await this.userRepo.findOne({
      where: { handle },
    });

    if (!user) return null;
    // Never show pending (pre-onboarding) profiles to others
    if (isPendingUser(user) && user.id !== viewerId) return null;

    let posts = await this.postRepo.find({
      where: { authorId: user.id, deletedAt: IsNull() },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    let followsMe = false;
    let isFollowing = false;
    let hasPendingFollowRequest = false;

    if (viewerId && viewerId !== user.id) {
      const follow = await this.followRepo.findOne({
        where: { followerId: user.id, followeeId: viewerId },
      });
      followsMe = !!follow;

      const viewerFollows = await this.followRepo.findOne({
        where: { followerId: viewerId, followeeId: user.id },
      });
      isFollowing = !!viewerFollows;

      if (user.isProtected && !isFollowing) {
        const pendingRequest = await this.followRequestRepo.findOne({
          where: {
            requesterId: viewerId,
            targetId: user.id,
            status: FollowRequestStatus.PENDING,
          },
        });
        hasPendingFollowRequest = !!pendingRequest;
        // Hide posts when profile is protected and viewer does not follow
        posts = [];
      }
    }

    const [postCount, replyCount, collectionCount, keepsCount, citedCount] =
      await Promise.all([
        this.postRepo.count({
          where: { authorId: user.id, deletedAt: IsNull() },
        }),
        this.replyRepo.count({ where: { authorId: user.id } }),
        this.collectionRepo.count({ where: { ownerId: user.id } }),
        this.keepRepo.count({ where: { userId: user.id } }),
        this.postEdgeRepo
          .createQueryBuilder('edge')
          .innerJoin(
            'posts',
            'p',
            'p.id = edge.from_post_id AND p.author_id = :userId AND p.deleted_at IS NULL',
          )
          .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
          .setParameter('userId', user.id)
          .getCount(),
      ]);

    return {
      ...user,
      posts,
      followsMe,
      isFollowing,
      hasPendingFollowRequest,
      postCount,
      replyCount,
      collectionCount,
      keepsCount,
      citedCount,
    };
  }

  /** Profile tab counts for a user (used by GET /users/me and GET /users/:handle). */
  async getProfileCounts(userId: string): Promise<{
    postCount: number;
    replyCount: number;
    collectionCount: number;
    keepsCount: number;
    citedCount: number;
  }> {
    const [postCount, replyCount, collectionCount, keepsCount, citedCount] =
      await Promise.all([
        this.postRepo.count({
          where: { authorId: userId, deletedAt: IsNull() },
        }),
        this.replyRepo.count({ where: { authorId: userId } }),
        this.collectionRepo.count({ where: { ownerId: userId } }),
        this.keepRepo.count({ where: { userId } }),
        this.postEdgeRepo
          .createQueryBuilder('edge')
          .innerJoin(
            'posts',
            'p',
            'p.id = edge.from_post_id AND p.author_id = :userId AND p.deleted_at IS NULL',
          )
          .where('edge.edge_type = :type', { type: EdgeType.QUOTE })
          .setParameter('userId', userId)
          .getCount(),
      ]);
    return {
      postCount,
      replyCount,
      collectionCount,
      keepsCount,
      citedCount,
    };
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

    // Email change: require confirmation — do not update email directly; send confirmation to new address
    if (updates.email != null && updates.email !== user.email) {
      const newEmail = updates.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new BadRequestException('Please enter a valid email address.');
      }
      const existing = await this.userRepo.findOne({
        where: { email: newEmail },
        select: ['id'],
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'This email is already in use by another account.',
        );
      }
      // Invalidate any existing pending email change for this user
      await this.emailChangeRequestRepo
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: id })
        .andWhere('consumed_at IS NULL')
        .execute();
      const req = EmailChangeRequest.createForUser(id, newEmail, 24);
      await this.emailChangeRequestRepo.save(req);
      const baseUrl =
        this.configService.get<string>('API_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        '';
      const path = this.configService.get<string>('API_URL')
        ? '/users/confirm-email'
        : '/confirm-email';
      const confirmUrl = baseUrl
        ? `${baseUrl.replace(/\/$/, '')}${path}?token=${req.token}`
        : '';
      const lang = (user.languages && user.languages[0]) || 'en';
      await this.emailService.sendEmailChangeConfirmation(
        newEmail,
        confirmUrl,
        newEmail,
        lang,
      );
      delete updates.email;
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
    const list = ids
      .map((id) => byId.get(id))
      .filter((u): u is User => u != null);
    // Never show pending (pre-onboarding) users in suggestions
    return list.filter((u) => !isPendingUser(u));
  }

  private async getSuggestedFallback(limit: number) {
    return this.userRepo.find({
      where: { handle: Not(TypeOrmLike('__pending_%')) },
      order: { followerCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * Whether the user has opted in to marketing emails. System emails (sign-in, invite, data export, account deletion) are always sent and must not check this.
   */
  async canReceiveMarketingEmail(userId: string): Promise<boolean> {
    const pref = await this.notifPrefRepo.findOne({
      where: { userId },
      select: ['emailMarketing'],
    });
    return pref?.emailMarketing ?? false;
  }

  /**
   * Whether the user has opted in to product-update emails. System emails are always sent and must not check this.
   */
  async canReceiveProductUpdateEmail(userId: string): Promise<boolean> {
    const pref = await this.notifPrefRepo.findOne({
      where: { userId },
      select: ['emailProductUpdates'],
    });
    return pref?.emailProductUpdates ?? false;
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
        emailMarketing: false,
        emailProductUpdates: false,
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
      email_marketing: pref.emailMarketing,
      email_product_updates: pref.emailProductUpdates,
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
      email_marketing: boolean;
      email_product_updates: boolean;
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
    if (updates.email_marketing !== undefined)
      pref.emailMarketing = updates.email_marketing;
    if (updates.email_product_updates !== undefined)
      pref.emailProductUpdates = updates.email_product_updates;
    await this.notifPrefRepo.save(pref);
    return this.getNotificationPrefs(userId);
  }

  async getUserPosts(
    userId: string,
    page: number,
    limit: number,
    type: 'posts' | 'replies' | 'quotes' | 'cited' = 'posts',
    viewerId?: string,
    cursor?: string,
  ): Promise<{ items: unknown[]; hasMore: boolean; nextCursor?: string }> {
    const skip = cursor ? 0 : (page - 1) * limit;
    const cursorDate = cursor ? new Date(cursor) : undefined;

    if (type === 'posts') {
      const qb = this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.authorId = :userId', { userId })
        .andWhere('post.deletedAt IS NULL');

      if (cursorDate && !isNaN(cursorDate.getTime())) {
        qb.andWhere('post.createdAt < :cursor', { cursor: cursorDate });
      }

      const posts = await qb
        .orderBy('post.createdAt', 'DESC')
        .skip(skip)
        .take(limit + 1)
        .getMany();

      const hasMore = posts.length > limit;
      const slice = posts.slice(0, limit);
      const last = slice[slice.length - 1];
      const nextCursor =
        hasMore && last?.createdAt ? last.createdAt.toISOString() : undefined;

      const postIds = slice.map((p) => p.id).filter(Boolean);
      const { likedIds, keptIds } = viewerId
        ? await this.interactionsService.getLikeKeepForViewer(viewerId, postIds)
        : { likedIds: new Set<string>(), keptIds: new Set<string>() };
      const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
      const items = await Promise.all(
        slice.map(async (p) => {
          const linkedIds = extractLinkedPostIds(p.body);
          const referenceMetadata =
            linkedIds.length > 0
              ? await getTitlesForPostIds(this.postRepo, linkedIds)
              : undefined;
          const viewerState = viewerId
            ? {
                isLiked: likedIds.has(p.id),
                isKept: keptIds.has(p.id),
              }
            : undefined;
          return postToPlain(p, getImageUrl, referenceMetadata, viewerState);
        }),
      );
      return { items, hasMore, nextCursor };
    }
    if (type === 'replies') {
      const qb = this.replyRepo
        .createQueryBuilder('reply')
        .leftJoinAndSelect('reply.post', 'post')
        .leftJoinAndSelect('post.author', 'postAuthor')
        .where('reply.authorId = :userId', { userId });

      if (cursorDate && !isNaN(cursorDate.getTime())) {
        qb.andWhere('reply.createdAt < :cursor', { cursor: cursorDate });
      }

      const replies = await qb
        .orderBy('reply.createdAt', 'DESC')
        .skip(skip)
        .take(limit + 1)
        .getMany();

      const hasMore = replies.length > limit;
      const slice = replies.slice(0, limit);
      const last = slice[slice.length - 1];
      const nextCursor =
        hasMore && last?.createdAt ? last.createdAt.toISOString() : undefined;

      const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);
      const items = slice.map((r) => replyToPlain(r, getImageUrl));
      return { items, hasMore, nextCursor };
    }
    // type === 'quotes': posts that quote posts authored by userId (same join pattern as getQuotes)
    if (type === 'quotes') {
      try {
        const qb = this.postRepo
          .createQueryBuilder('quoter')
          .innerJoin(PostEdge, 'edge', 'edge.from_post_id = quoter.id')
          .innerJoin('posts', 'quoted', 'quoted.id = edge.to_post_id')
          .where('edge.edgeType = :edgeType', { edgeType: EdgeType.QUOTE })
          .andWhere('quoted.author_id = :userId', { userId })
          .andWhere('quoter.deletedAt IS NULL')
          .leftJoinAndSelect('quoter.author', 'author');

        if (cursorDate && !isNaN(cursorDate.getTime())) {
          qb.andWhere('quoter.createdAt < :cursor', { cursor: cursorDate });
        }

        const quoters = await qb
          .orderBy('quoter.createdAt', 'DESC')
          .skip(skip)
          .take(limit + 1)
          .getMany();

        const hasMore = quoters.length > limit;
        const slice = quoters.slice(0, limit);
        const last = slice[slice.length - 1];
        const nextCursor =
          hasMore && last?.createdAt ? last.createdAt.toISOString() : undefined;

        const postIds = slice.map((p) => p.id).filter(Boolean);
        const { likedIds, keptIds } = viewerId
          ? await this.interactionsService.getLikeKeepForViewer(
              viewerId,
              postIds,
            )
          : { likedIds: new Set<string>(), keptIds: new Set<string>() };
        const getImageUrl = (key: string) =>
          this.uploadService.getImageUrl(key);
        const items = await Promise.all(
          slice.map(async (p) => {
            const linkedIds = extractLinkedPostIds(p.body);
            const referenceMetadata =
              linkedIds.length > 0
                ? await getTitlesForPostIds(this.postRepo, linkedIds)
                : undefined;
            const viewerState = viewerId
              ? {
                  isLiked: likedIds.has(p.id),
                  isKept: keptIds.has(p.id),
                }
              : undefined;
            return postToPlain(p, getImageUrl, referenceMetadata, viewerState);
          }),
        );
        return { items, hasMore, nextCursor };
      } catch (err) {
        console.error('getUserPosts quotes error', err);
        return { items: [], hasMore: false };
      }
    }
    // type === 'cited': posts that this user has cited (outgoing quotes). Query from Post (cited) via PostEdge so we use the same entity pattern as 'quotes'.
    if (type === 'cited') {
      try {
        const qb = this.postRepo
          .createQueryBuilder('cited')
          .innerJoin(PostEdge, 'edge', 'edge.to_post_id = cited.id')
          .innerJoin(
            'posts',
            'fromPost',
            'fromPost.id = edge.from_post_id AND fromPost.author_id = :userId AND fromPost.deleted_at IS NULL',
          )
          .where('edge.edgeType = :edgeType', { edgeType: EdgeType.QUOTE })
          .andWhere('cited.deletedAt IS NULL')
          .leftJoinAndSelect('cited.author', 'author')
          .orderBy('edge.createdAt', 'DESC')
          .setParameter('userId', userId)
          .skip(skip)
          .take(limit + 1);

        if (cursorDate && !isNaN(cursorDate.getTime())) {
          qb.andWhere('edge.createdAt < :cursor', { cursor: cursorDate });
        }

        const citedPosts = await qb.getMany();
        const hasMore = citedPosts.length > limit;
        const slice = citedPosts.slice(0, limit);

        const postIds = slice.map((p) => p.id).filter(Boolean);
        const { likedIds, keptIds } = viewerId
          ? await this.interactionsService.getLikeKeepForViewer(
              viewerId,
              postIds,
            )
          : { likedIds: new Set<string>(), keptIds: new Set<string>() };
        const getImageUrl = (key: string) =>
          this.uploadService.getImageUrl(key);
        const items = await Promise.all(
          slice.map(async (p) => {
            const linkedIds = extractLinkedPostIds(p.body);
            const referenceMetadata =
              linkedIds.length > 0
                ? await getTitlesForPostIds(this.postRepo, linkedIds)
                : undefined;
            const viewerState = viewerId
              ? {
                  isLiked: likedIds.has(p.id),
                  isKept: keptIds.has(p.id),
                }
              : undefined;
            return postToPlain(p, getImageUrl, referenceMetadata, viewerState);
          }),
        );
        return { items, hasMore, nextCursor: undefined };
      } catch (err) {
        console.error('getUserPosts cited error', err);
        return { items: [], hasMore: false };
      }
    }
    return { items: [], hasMore: false };
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
      .orderBy('quoter.createdAt', 'DESC')
      .take(20)
      .getMany();
  }

  /**
   * Soft-delete user and all their posts. Used after account-deletion confirmation or by admin.
   * This is the main code path that bulk-soft-deletes posts (all posts by this user).
   */
  async deleteUser(userId: string) {
    const postCount = await this.postRepo.count({
      where: { authorId: userId },
    });
    if (postCount > 0) {
      this.logger.warn(
        `deleteUser: soft-deleting ${postCount} posts for user ${userId}`,
      );
    }
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

  /** Confirm email change with token from email link. Updates user email and marks request consumed. */
  async confirmEmailChange(token: string): Promise<{ success: true }> {
    const req = await this.emailChangeRequestRepo.findOne({
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
    const existing = await this.userRepo.findOne({
      where: { email: req.newEmail },
      select: ['id'],
    });
    if (existing && existing.id !== req.userId) {
      throw new BadRequestException(
        'This email is already in use by another account.',
      );
    }
    req.consumedAt = new Date();
    await this.emailChangeRequestRepo.save(req);
    await this.userRepo.update(req.userId, { email: req.newEmail });
    const user = await this.userRepo.findOneOrFail({
      where: { id: req.userId },
    });
    this.meilisearch
      .indexUser(user)
      .catch((err) => console.error('Failed to update user index', err));
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
    const likes = await this.likeRepo.find({
      where: { userId },
      relations: ['post'],
    });
    const keeps = await this.keepRepo.find({
      where: { userId },
      relations: ['post'],
    });
    const following = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['followee'],
    });
    const followers = await this.followRepo.find({
      where: { followeeId: userId },
      relations: ['follower'],
    });
    const reads = await this.readRepo.find({
      where: { userId },
      relations: ['post'],
    });
    const notifications = await this.notifRepo.find({ where: { userId } });
    const collections = await this.collectionRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
      relations: ['collectionItems', 'collectionItems.post'],
    });
    const notificationPrefs = await this.notifPrefRepo.findOne({
      where: { userId },
    });

    const blocks = await this.blockRepo.find({
      where: { blockerId: userId },
      relations: ['blocked'],
    });
    const mutes = await this.muteRepo.find({
      where: { muterId: userId },
      relations: ['muted'],
    });

    const threads = await this.dmThreadRepo.find({
      where: [{ userA: userId }, { userB: userId }],
    });
    const threadIds = threads.map((t) => t.id);
    let messages: DmMessage[] = [];
    if (threadIds.length > 0) {
      messages = await this.dmMessageRepo.find({
        where: { threadId: In(threadIds) },
        order: { createdAt: 'ASC' },
      });
    }

    const dmUserIds = new Set<string>();
    threads.forEach((t) => {
      dmUserIds.add(t.userA);
      dmUserIds.add(t.userB);
    });
    messages.forEach((m) => dmUserIds.add(m.senderId));

    const dmUsers = await this.userRepo.find({
      where: { id: In([...dmUserIds]) },
      select: ['id', 'handle', 'displayName'],
    });
    const userMap = new Map(
      dmUsers.map((u) => [
        u.id,
        { handle: u.handle, displayName: u.displayName },
      ]),
    );

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
      blocks,
      mutes,
      dmThreads: threads,
      dmMessages: messages,
      userMap,
      exportedAt: new Date(),
    };
  }

  /**
   * Sanitize export data for download: remove all IDs (user ids, post ids, etc.)
   * so the exported zip never contains internal identifiers.
   */
  sanitizeExportForDownload(
    raw: Awaited<ReturnType<UsersService['exportUserData']>>,
  ): Record<string, unknown> {
    if (!raw) return {};

    const profile = raw.user
      ? {
          handle: raw.user.handle,
          displayName: raw.user.displayName,
          bio: raw.user.bio ?? null,
          email: raw.user.email ?? null,
          languages: raw.user.languages ?? [],
          isProtected: raw.user.isProtected ?? false,
          createdAt: raw.user.createdAt,
          updatedAt: raw.user.updatedAt,
        }
      : null;

    const posts = (raw.posts ?? []).map((p: Post & { author?: User }) => ({
      title: p.title ?? null,
      body: p.body,
      visibility: p.visibility ?? 'PUBLIC',
      lang: p.lang ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      replyCount: p.replyCount ?? 0,
      quoteCount: p.quoteCount ?? 0,
      readingTimeMinutes: p.readingTimeMinutes ?? 0,
      author: p.author
        ? { handle: p.author.handle, displayName: p.author.displayName }
        : null,
    }));

    const replies = (raw.replies ?? []).map(
      (r: Reply & { author?: User; post?: Post }) => ({
        body: r.body,
        lang: r.lang ?? null,
        createdAt: r.createdAt,
        author: r.author
          ? { handle: r.author.handle, displayName: r.author.displayName }
          : null,
        postTitle: r.post?.title ?? null,
      }),
    );

    const readHistory = (raw.readHistory ?? []).map(
      (r: PostRead & { post?: Post }) => ({
        lastReadAt: r.lastReadAt ?? r.createdAt,
        durationSeconds:
          (r as { durationSeconds?: number }).durationSeconds ?? 0,
        postTitle: r.post?.title ?? null,
      }),
    );

    const likes = (raw.likes ?? []).map((l: Like & { post?: Post }) => ({
      createdAt: l.createdAt,
      postTitle: l.post?.title ?? null,
    }));

    const keeps = (raw.keeps ?? []).map((k: Keep & { post?: Post }) => ({
      createdAt: k.createdAt,
      postTitle: k.post?.title ?? null,
    }));

    const following = (raw.following ?? []).map(
      (f: Follow & { followee?: User }) => ({
        handle: f.followee?.handle ?? null,
        displayName: f.followee?.displayName ?? null,
        createdAt: f.createdAt,
      }),
    );

    const followers = (raw.followers ?? []).map(
      (f: Follow & { follower?: User }) => ({
        handle: f.follower?.handle ?? null,
        displayName: f.follower?.displayName ?? null,
        createdAt: f.createdAt,
      }),
    );

    const collections = (raw.collections ?? []).map(
      (c: Collection & { collectionItems?: CollectionItem[] }) => ({
        title: c.title,
        description: c.description ?? null,
        isPublic: c.isPublic ?? false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        items:
          c.collectionItems?.map((item: CollectionItem) => ({
            postTitle: item.post?.title ?? null,
            addedAt: item.addedAt,
          })) ?? [],
      }),
    );

    const blocks = (raw.blocks ?? []).map((b: Block & { blocked?: User }) => ({
      blockedUser: b.blocked?.handle ?? null,
      createdAt: b.createdAt,
    }));

    const mutes = (raw.mutes ?? []).map((m: Mute & { muted?: User }) => ({
      mutedUser: m.muted?.handle ?? null,
      createdAt: m.createdAt,
    }));

    const dmThreads = (raw.dmThreads ?? []).map((t) => {
      const otherUserId = t.userA === raw.user?.id ? t.userB : t.userA;
      const otherUser = raw.userMap?.get(otherUserId);
      const threadMessages = (raw.dmMessages ?? [])
        .filter((m) => m.threadId === t.id)
        .map((m) => {
          const sender = raw.userMap?.get(m.senderId);
          return {
            sender: sender?.handle ?? 'unknown',
            body: m.body,
            createdAt: m.createdAt,
            readAt: m.readAt,
          };
        });
      return {
        withUser: otherUser?.handle ?? 'unknown',
        messages: threadMessages,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    const notificationPrefs = raw.notificationPrefs
      ? {
          pushEnabled: raw.notificationPrefs.pushEnabled,
          replies: raw.notificationPrefs.replies,
          quotes: raw.notificationPrefs.quotes,
          mentions: raw.notificationPrefs.mentions,
          dms: raw.notificationPrefs.dms,
          follows: raw.notificationPrefs.follows,
          saves: raw.notificationPrefs.saves,
          quietHoursStart: raw.notificationPrefs.quietHoursStart ?? null,
          quietHoursEnd: raw.notificationPrefs.quietHoursEnd ?? null,
          emailMarketing: raw.notificationPrefs.emailMarketing,
          emailProductUpdates: raw.notificationPrefs.emailProductUpdates,
        }
      : null;

    return {
      user: profile,
      posts,
      replies,
      readHistory,
      likes,
      keeps,
      following,
      followers,
      collections,
      blocks,
      mutes,
      directMessages: dmThreads,
      notificationPrefs,
      exportedAt: raw.exportedAt,
    };
  }

  /** UUID v4 pattern: avoid passing handle to id column (PostgreSQL throws "invalid input syntax for type uuid"). */
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /** Resolve handle or UUID to user id. Returns null if not found or if user is pending (pre-onboarding). */
  async resolveUserId(idOrHandle: string): Promise<string | null> {
    if (!idOrHandle) return null;
    const isUuid = UsersService.UUID_REGEX.test(idOrHandle.trim());
    const user = await this.userRepo.findOne({
      where: isUuid
        ? [{ id: idOrHandle }, { handle: idOrHandle }]
        : [{ handle: idOrHandle }],
      select: ['id', 'handle'],
    });
    if (!user) return null;
    if (isPendingUser(user)) return null;
    return user.id;
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

  /** Collections visible to the viewer for this owner. Owner sees all. Followers see all (public + private). Others who can see the profile see only public collections. */
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
    const showPrivate =
      viewerId === ownerId ||
      !!(
        viewerId &&
        (await this.followRepo.findOne({
          where: { followerId: viewerId, followeeId: ownerId },
        }))
      );
    return this.getUserCollections(
      ownerId,
      page,
      limit,
      showPrivate ? undefined : true,
    );
  }

  /** All collections by owner (public + private). For profile owner viewing their own profile. */
  async getUserAllCollections(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Partial<Collection>[]; hasMore: boolean }> {
    return this.getUserCollections(ownerId, page, limit, undefined);
  }

  /** Get collections for owner with optional public-only filter. publicOnly true = only public, undefined = all. */
  async getUserCollections(
    ownerId: string,
    page: number,
    limit: number,
    publicOnly?: boolean,
  ): Promise<{ items: Partial<Collection>[]; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    const qb = this.collectionRepo
      .createQueryBuilder('c')
      .where('c.ownerId = :ownerId', { ownerId })
      .loadRelationCountAndMap('c.itemCount', 'c.items')
      .orderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(limit + 1);
    if (publicOnly === true) {
      qb.andWhere('c.is_public = true');
    }
    const collections = await qb.getMany();
    const slice = collections.slice(0, limit);
    const ids = slice.map((c) => c.id);
    const latestMap =
      await this.collectionsService.getLatestItemPreviewByPostDate(ids);
    type CollectionWithItemCount = (typeof slice)[number] & {
      itemCount?: number;
    };
    const items = slice.map((c: CollectionWithItemCount) => {
      const latest = latestMap[c.id];
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        isPublic: c.isPublic,
        shareSaves: c.shareSaves,
        createdAt: c.createdAt,
        ownerId: c.ownerId,
        itemCount: c.itemCount ?? 0,
        previewImageKey: latest?.headerImageKey ?? null,
        recentPost: latest
          ? {
              id: latest.postId,
              title: latest.title ?? null,
              bodyExcerpt: latest.bodyExcerpt ?? null,
              headerImageKey: latest.headerImageKey ?? null,
            }
          : null,
      };
    });
    return { items, hasMore: collections.length > limit };
  }

  async getFollowing(userId: string) {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['followee'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.followee).filter((u) => !isPendingUser(u));
  }

  async getFollowers(userId: string) {
    const follows = await this.followRepo.find({
      where: { followeeId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => f.follower).filter((u) => !isPendingUser(u));
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
