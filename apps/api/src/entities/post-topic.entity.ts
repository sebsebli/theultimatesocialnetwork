import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';
import { Topic } from './topic.entity';

@Entity('post_topics')
export class PostTopic {
  @PrimaryColumn({ name: 'post_id' })
  postId: string;

  @PrimaryColumn({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;
}
