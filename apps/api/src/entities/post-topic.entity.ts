import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Post } from './post.entity';
import { Topic } from './topic.entity';

@Entity('post_topics')
export class PostTopic {
  @PrimaryColumn({ name: 'post_id' })
  postId: string;

  @Index() // Add index for efficient lookups by topic
  @PrimaryColumn({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;
}
