import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Post } from '../entities/post.entity';
import { PostTopic } from '../entities/post-topic.entity';
import { ExploreService } from '../explore/explore.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(PostTopic) private postTopicRepo: Repository<PostTopic>,
    private exploreService: ExploreService,
  ) {}

  async findOne(slug: string) {
    const topic = await this.topicRepo.findOne({
      where: { slug },
    });

    if (!topic) return null;

    // Get posts in topic - Optimized DB query
    const posts = await this.postRepo.createQueryBuilder('post')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .leftJoinAndSelect('post.author', 'author')
      .where('pt.topic_id = :topicId', { topicId: topic.id })
      .andWhere('post.deleted_at IS NULL')
      .orderBy('post.created_at', 'DESC')
      .take(50)
      .getMany();

    // Get "Start here" posts (most cited)
    const startHere = await this.exploreService.getTopicStartHere(topic.id, 10);

    return {
      ...topic,
      posts,
      startHere,
    };
  }

  async getPosts(topicId: string, limit = 50, offset = 0) {
    return this.postRepo.createQueryBuilder('post')
      .innerJoin('post_topics', 'pt', 'pt.post_id = post.id')
      .leftJoinAndSelect('post.author', 'author')
      .where('pt.topic_id = :topicId', { topicId })
      .andWhere('post.deleted_at IS NULL')
      .orderBy('post.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();
  }
}
