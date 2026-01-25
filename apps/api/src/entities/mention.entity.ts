import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from './user.entity';

@Entity('mentions')
export class Mention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', nullable: true })
  postId: string;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'reply_id', nullable: true })
  replyId: string;

  @ManyToOne(() => Reply, { nullable: true })
  @JoinColumn({ name: 'reply_id' })
  reply: Reply;

  @Column({ name: 'mentioned_user_id' })
  mentionedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'mentioned_user_id' })
  mentionedUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
