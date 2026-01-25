import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicFollow } from '../entities/topic-follow.entity';
import { Topic } from '../entities/topic.entity';

@Injectable()
export class TopicFollowsService {
  constructor(
    @InjectRepository(TopicFollow) private topicFollowRepo: Repository<TopicFollow>,
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
}
