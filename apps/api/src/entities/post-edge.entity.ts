import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Post } from './post.entity';

export enum EdgeType {
  LINK = 'LINK',
  QUOTE = 'QUOTE',
}

@Entity('post_edges')
export class PostEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_post_id', type: 'uuid' })
  @Index()
  fromPostId: string;

  @Column({ name: 'to_post_id', type: 'uuid' })
  @Index()
  toPostId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'from_post_id' })
  fromPost: Post;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'to_post_id' })
  toPost: Post;

  @Column({
    type: 'enum',
    enum: EdgeType,
    name: 'edge_type',
  })
  edgeType: EdgeType;

  @Column({ name: 'anchor_text', type: 'text', nullable: true })
  anchorText: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
