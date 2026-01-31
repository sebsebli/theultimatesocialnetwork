import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  IsNull,
  type FindOptionsWhere,
} from 'typeorm';
import { Queue } from 'bullmq';
import { Reply } from '../entities/reply.entity';
import { ReplyLike } from '../entities/reply-like.entity';
import { Post } from '../entities/post.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { LanguageDetectionService } from '../shared/language-detection.service';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';
import { MeilisearchService } from '../search/meilisearch.service';

const REPLY_BODY_MIN = 2;
const REPLY_BODY_MAX = 1000;

@Injectable()
export class RepliesService {
  constructor(
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(ReplyLike) private replyLikeRepo: Repository<ReplyLike>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private languageDetection: LanguageDetectionService,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
    private meilisearch: MeilisearchService,
    @Inject('REPLY_QUEUE') private replyQueue: Queue,
  ) {}

  async create(
    userId: string,
    postId: string,
    body: string,
    parentReplyId?: string,
  ) {
    const trimmed = (body ?? '').trim();
    if (trimmed.length < REPLY_BODY_MIN) {
      throw new BadRequestException(
        `Comment must be at least ${REPLY_BODY_MIN} characters`,
      );
    }
    if (trimmed.length > REPLY_BODY_MAX) {
      throw new BadRequestException(
        `Comment must be at most ${REPLY_BODY_MAX} characters`,
      );
    }

    // AI Safety Check (Fast Stage 1 only)
    const safety = await this.safetyService.checkContent(
      trimmed,
      userId,
      'reply',
      { onlyFast: true },
    );
    if (!safety.safe) {
      throw new BadRequestException(
        safety.reason || 'Reply flagged by safety check',
      );
    }

    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check reply depth (max 2 levels)
    if (parentReplyId) {
      const parentReply = await this.replyRepo.findOne({
        where: { id: parentReplyId },
        relations: ['parentReply'],
      });
      if (!parentReply || parentReply.postId !== postId) {
        throw new BadRequestException(
          'Parent reply not found or does not belong to this post',
        );
      }
      if (parentReply.parentReplyId) {
        throw new BadRequestException('Maximum reply depth exceeded');
      }
    }

    // Detect language (with user profile fallback)
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['languages'],
    });
    const { lang, confidence } = await this.languageDetection.detectLanguage(
      trimmed,
      userId,
      user?.languages || [],
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedReply: Reply;

    try {
      // Create reply
      const reply = this.replyRepo.create({
        postId,
        authorId: userId,
        body: trimmed,
        parentReplyId: parentReplyId || undefined,
        lang,
        langConfidence: confidence,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      savedReply = await queryRunner.manager.save(Reply, reply);

      // Increment reply count on post
      await queryRunner.manager.increment(
        Post,
        { id: postId },
        'replyCount',
        1,
      );

      // Extract mentions (@handle, handles can contain dots e.g. sarah.tech) and save them (Notification dispatched in worker)
      const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
      let mentionMatch;
      const mentionedHandles = new Set<string>();
      while ((mentionMatch = mentionRegex.exec(body)) !== null) {
        mentionedHandles.add(mentionMatch[1]);
      }

      for (const handle of mentionedHandles) {
        const mentionedUser = await queryRunner.manager.findOne(User, {
          where: { handle },
        });
        if (mentionedUser && mentionedUser.id !== userId) {
          await queryRunner.manager.save(Mention, {
            postId,
            replyId: savedReply.id,
            mentionedUserId: mentionedUser.id,
          });
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Queue Job for Side Effects (Safety Stage 2, Neo4j, Notifications)
    await this.replyQueue.add('process', {
      replyId: savedReply.id,
      userId,
      postId,
    });

    // Re-index parent post so search has fresh replyCount
    const postWithAuthor = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['author'],
    });
    if (postWithAuthor) {
      this.meilisearch
        .indexPost({
          id: postWithAuthor.id,
          title: postWithAuthor.title,
          body: postWithAuthor.body,
          authorId: postWithAuthor.authorId,
          author: postWithAuthor.author
            ? {
                displayName:
                  postWithAuthor.author.displayName ||
                  postWithAuthor.author.handle,
                handle: postWithAuthor.author.handle,
              }
            : undefined,
          lang: postWithAuthor.lang,
          createdAt: postWithAuthor.createdAt,
          quoteCount: postWithAuthor.quoteCount,
          replyCount: postWithAuthor.replyCount,
        })
        .catch((err) =>
          console.error('Failed to re-index post after reply', err),
        );
    }

    return savedReply;
  }

  async findByPost(
    postId: string,
    limit = 50,
    offset = 0,
    currentUserId?: string,
    parentReplyId?: string,
  ) {
    const where: FindOptionsWhere<Reply> = { postId };
    if (parentReplyId != null && parentReplyId !== '') {
      where.parentReplyId = parentReplyId;
    } else {
      where.parentReplyId = IsNull();
    }

    const replies = await this.replyRepo.find({
      where,
      relations: ['author', 'parentReply', 'parentReply.author'],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    let withMeta = replies.map((r) => ({ ...r, subreplyCount: 0 }));

    if (parentReplyId == null || parentReplyId === '') {
      const topLevelIds = replies.map((r) => r.id);
      if (topLevelIds.length > 0) {
        const counts = await this.replyRepo
          .createQueryBuilder('r')
          .select('r.parent_reply_id', 'parentId')
          .addSelect('COUNT(*)', 'count')
          .where('r.post_id = :postId', { postId })
          .andWhere('r.parent_reply_id IN (:...ids)', { ids: topLevelIds })
          .groupBy('r.parent_reply_id')
          .getRawMany<{ parentId: string; count: string }>();
        const countMap = new Map(
          counts.map((c) => [c.parentId, Number(c.count)]),
        );
        withMeta = replies.map((r) => ({
          ...r,
          subreplyCount: countMap.get(r.id) ?? 0,
        }));
      }
    }

    if (!currentUserId) {
      return withMeta.map((r) => ({
        ...r,
        privateLikeCount: undefined,
        isLiked: false,
      }));
    }
    const replyIds = withMeta.map((r) => r.id);
    const likedByMe = await this.replyLikeRepo.find({
      where: { userId: currentUserId, replyId: In(replyIds) },
    });
    const likedSet = new Set(likedByMe.map((l) => l.replyId));
    return withMeta.map((r) => ({
      ...r,
      privateLikeCount: r.authorId === currentUserId ? r.likeCount : undefined,
      isLiked: likedSet.has(r.id),
    }));
  }

  async findOne(postId: string, replyId: string, currentUserId?: string) {
    const reply = await this.replyRepo.findOne({
      where: { id: replyId, postId },
      relations: ['author', 'parentReply', 'parentReply.author'],
    });
    if (!reply) throw new NotFoundException('Reply not found');
    if (!currentUserId) {
      return { ...reply, privateLikeCount: undefined, isLiked: false };
    }
    const liked = await this.replyLikeRepo.findOne({
      where: { userId: currentUserId, replyId: reply.id },
    });
    return {
      ...reply,
      privateLikeCount:
        reply.authorId === currentUserId ? reply.likeCount : undefined,
      isLiked: !!liked,
    };
  }

  async likeReply(replyId: string, userId: string) {
    const reply = await this.replyRepo.findOne({ where: { id: replyId } });
    if (!reply) throw new NotFoundException('Reply not found');
    const existing = await this.replyLikeRepo.findOne({
      where: { userId, replyId },
    });
    if (existing) return { liked: true };
    await this.replyLikeRepo.save({ userId, replyId });
    await this.replyRepo.increment({ id: replyId }, 'likeCount', 1);
    return { liked: true };
  }

  async unlikeReply(replyId: string, userId: string) {
    const existing = await this.replyLikeRepo.findOne({
      where: { userId, replyId },
    });
    if (!existing) return { liked: false };
    await this.replyLikeRepo.remove(existing);
    await this.replyRepo.decrement({ id: replyId }, 'likeCount', 1);
    return { liked: false };
  }

  async delete(userId: string, replyId: string) {
    const reply = await this.replyRepo.findOne({
      where: { id: replyId, authorId: userId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found or unauthorized');
    }

    await this.replyRepo.softDelete(replyId);
    await this.postRepo.decrement({ id: reply.postId }, 'replyCount', 1);
  }
}
