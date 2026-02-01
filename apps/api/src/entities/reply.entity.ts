import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('replies')
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  @Index() // Efficient lookup for post replies
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index() // Efficient lookup for user replies
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'parent_reply_id', type: 'uuid', nullable: true })
  parentReplyId: string | null;

  @ManyToOne(() => Reply, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_reply_id' })
  parentReply: Reply | null;

  @Column('text')
  body: string;

  @Column({ type: 'text', nullable: true })
  lang: string;

  @Column({ name: 'lang_confidence', type: 'float', nullable: true })
  langConfidence: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;
}
