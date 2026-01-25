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

    if (!topic) {
      return null;
    }

    // Get posts in topic
    const postTopics = await this.postTopicRepo.find({
      where: { topicId: topic.id },
      relations: ['post', 'post.author'],
    });
    
    const posts = postTopics
      .map(pt => pt.post)
      .filter(post => post && !post.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    // Get "Start here" posts (most cited)
    const startHere = await this.exploreService.getTopicStartHere(topic.id, 10);

    return {
      ...topic,
      posts,
      startHere,
    };
  }

  async getPosts(topicId: string) {
    const postTopics = await this.postTopicRepo.find({
      where: { topicId },
      relations: ['post', 'post.author'],
    });
    
    return postTopics
      .map(pt => pt.post)
      .filter(post => post && !post.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  }
}
