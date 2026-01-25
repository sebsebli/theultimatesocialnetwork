import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Reply } from '../entities/reply.entity';
import { Post } from '../entities/post.entity';
import { Mention } from '../entities/mention.entity';
import { User } from '../entities/user.entity';
import { LanguageDetectionService } from '../shared/language-detection.service';
import { Neo4jService } from '../database/neo4j.service';
import { NotificationHelperService } from '../shared/notification-helper.service';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class RepliesService {
  constructor(
    @InjectRepository(Reply) private replyRepo: Repository<Reply>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Mention) private mentionRepo: Repository<Mention>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
    private languageDetection: LanguageDetectionService,
    private neo4jService: Neo4jService,
    private notificationHelper: NotificationHelperService,
    private safetyService: SafetyService,
  ) {}

  async create(userId: string, postId: string, body: string, parentReplyId?: string) {
    // AI Safety Check (Two-stage: Bayesian → Gemma)
    const safety = await this.safetyService.checkContent(body, userId, 'reply');
    if (!safety.safe) {
      throw new BadRequestException(safety.reason || 'Reply flagged by safety check');
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
      if (parentReply?.parentReplyId) {
        throw new Error('Maximum reply depth exceeded');
      }
    }

    // Detect language (with user profile fallback)
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['languages'] });
    const { lang, confidence } = await this.languageDetection.detectLanguage(
      body,
      userId,
      user?.languages || [],
    );

    // Create reply
    const reply = this.replyRepo.create({
      postId,
      authorId: userId,
      body,
      parentReplyId: parentReplyId || undefined,
      lang,
      langConfidence: confidence,
    });

    const savedReply = await this.replyRepo.save(reply);

    // Increment reply count on post
    await this.postRepo.increment({ id: postId }, 'replyCount', 1);

    // Notify post author (if not self-reply)
    if (post.authorId !== userId) {
      await this.notificationHelper.createNotification({
        userId: post.authorId,
        type: 'REPLY' as any,
        actorUserId: userId,
        postId: postId,
        replyId: savedReply.id,
      });
    }

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    let mentionMatch;
    const mentionedHandles = new Set<string>();
    while ((mentionMatch = mentionRegex.exec(body)) !== null) {
      mentionedHandles.add(mentionMatch[1]);
    }

    for (const handle of mentionedHandles) {
      const mentionedUser = await this.userRepo.findOne({
        where: { handle },
      });
      if (mentionedUser && mentionedUser.id !== userId) {
        await this.mentionRepo.save({
          replyId: savedReply.id,
          mentionedUserId: mentionedUser.id,
        });

        await this.notificationHelper.createNotification({
          userId: mentionedUser.id,
          type: 'MENTION' as any,
          actorUserId: userId,
          postId: postId,
          replyId: savedReply.id,
        });
      }
    }

    return savedReply;
  }

  async findByPost(postId: string) {
    return this.replyRepo.find({
      where: { postId },
      relations: ['author', 'parentReply', 'parentReply.author'],
      order: { createdAt: 'ASC' },
    });
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
