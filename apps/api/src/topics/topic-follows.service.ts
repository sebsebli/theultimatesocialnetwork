import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { TopicFollow } from '../entities/topic-follow.entity';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { UploadService } from '../upload/upload.service';

interface TopicRawRow {
  topic_id: string;
  postCount: string;
  followerCount: string;
}

@Injectable()
export class TopicFollowsService {
  constructor(
    @InjectRepository(TopicFollow)
    private topicFollowRepo: Repository<TopicFollow>,
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    private dataSource: DataSource,
    private uploadService: UploadService,
  ) {}

  async follow(userId: string, topicId: string) {
    const topic = await this.topicRepo.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new Error('Topic not found');
    }

    const existing = await this.topicFollowRepo.findOne({
      where: { userId, topicId },
    });

    if (existing) {
      return existing;
    }

    const follow = this.topicFollowRepo.create({
      userId,
      topicId,
    });

    return this.topicFollowRepo.save(follow);
  }

  async unfollow(userId: string, topicId: string) {
    const follow = await this.topicFollowRepo.findOne({
      where: { userId, topicId },
    });

    if (follow) {
      await this.topicFollowRepo.remove(follow);
    }

    return { success: true };
  }

  async isFollowing(userId: string, topicId: string): Promise<boolean> {
    const follow = await this.topicFollowRepo.findOne({
      where: { userId, topicId },
    });
    return !!follow;
  }

  async getFollowedTopics(userId: string) {
    const { entities, raw } = await this.topicRepo
      .createQueryBuilder('topic')
      .innerJoin('topic_follows', 'tf', 'tf.topic_id = topic.id')
      .where('tf.user_id = :userId', { userId })
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)', 'cnt')
            .from('post_topics', 'pt')
            .where('pt.topic_id = topic.id'),
        'postCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)', 'cnt')
            .from('topic_follows', 'tf2')
            .where('tf2.topic_id = topic.id'),
        'followerCount',
      )
      .getRawAndEntities();

    const base = entities.map((entity) => {
      const r = (raw as TopicRawRow[]).find((x) => x.topic_id === entity.id);
      return {
        ...entity,
        postCount: r ? parseInt(r.postCount, 10) : 0,
        followerCount: r ? parseInt(r.followerCount, 10) : 0,
        isFollowing: true,
      };
    });

    const topicIds = base.map((t) => t.id);
    if (topicIds.length === 0) return base;

    type LatestRow = { topicId: string; postId: string };
    const latestRows: LatestRow[] = await this.dataSource
      .createQueryBuilder()
      .select('pt.topic_id', 'topicId')
      .addSelect('p.id', 'postId')
      .from(PostTopic, 'pt')
      .innerJoin(Post, 'p', 'p.id = pt.post_id AND p.deleted_at IS NULL')
      .where('pt.topic_id IN (:...topicIds)', { topicIds })
      .distinctOn(['pt.topic_id'])
      .orderBy('pt.topic_id')
      .addOrderBy('p.created_at', 'DESC')
      .getRawMany<LatestRow>()
      .catch(() => []);

    const postIds = [...new Set(latestRows.map((r) => r.postId))];
    const topicToPostId = new Map(latestRows.map((r) => [r.topicId, r.postId]));

    const posts =
      postIds.length > 0
        ? await this.postRepo.find({
            where: { id: In(postIds) },
            relations: ['author'],
            select: [
              'id',
              'authorId',
              'title',
              'body',
              'headerImageKey',
              'createdAt',
            ],
          })
        : [];
    const postMap = new Map(posts.map((p) => [p.id, p]));

    function bodyExcerpt(body: string, maxLen = 120): string {
      if (!body || typeof body !== 'string') return '';
      const stripped = body
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
      return stripped.length <= maxLen
        ? stripped
        : stripped.slice(0, maxLen) + '…';
    }

    const getImageUrl = (key: string) => this.uploadService.getImageUrl(key);

    return base.map((t) => {
      const postId = topicToPostId.get(t.id);
      const post = postId ? postMap.get(postId) : undefined;
      const headerImageKey = post?.headerImageKey ?? null;
      const recentPost = post
        ? {
            id: post.id,
            title: post.title ?? null,
            bodyExcerpt: bodyExcerpt(post.body),
            headerImageKey,
            headerImageUrl:
              headerImageKey != null && headerImageKey !== ''
                ? getImageUrl(headerImageKey)
                : null,
            author: post.author
              ? {
                  handle: post.author.handle,
                  displayName: post.author.displayName ?? post.author.handle,
                }
              : null,
            createdAt: post.createdAt?.toISOString?.() ?? null,
          }
        : null;
      return {
        ...t,
        recentPostImageKey: recentPost?.headerImageKey ?? null,
        recentPostImageUrl:
          recentPost?.headerImageKey != null && recentPost.headerImageKey !== ''
            ? getImageUrl(recentPost.headerImageKey)
            : null,
        recentPost,
      };
    });
  }
}
