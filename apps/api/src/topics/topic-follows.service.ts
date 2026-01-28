import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicFollow } from '../entities/topic-follow.entity';
import { Topic } from '../entities/topic.entity';

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

    return entities.map((entity) => {
      const r = (raw as TopicRawRow[]).find((x) => x.topic_id === entity.id);
      return {
        ...entity,
        postCount: r ? parseInt(r.postCount, 10) : 0,
        followerCount: r ? parseInt(r.followerCount, 10) : 0,
      };
    });
  }
}
