import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PostEdge } from './post-edge.entity';
import { PostTopic } from './post-topic.entity';
import { Mention } from './mention.entity';

export enum PostVisibility {
  FOLLOWERS = 'FOLLOWERS',
  PUBLIC = 'PUBLIC',
}

@Entity('posts')
@Index(['authorId', 'createdAt']) // Fast Profile Feeds
@Index(['status', 'createdAt']) // Fast Public Feeds
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index() // FK lookup
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({
    type: 'enum',
    enum: ['PUBLISHED', 'DRAFT'],
    default: 'PUBLISHED',
  })
  @Index()
  status: 'PUBLISHED' | 'DRAFT';

  @Column('text')
  body: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ name: 'header_image_key', type: 'text', nullable: true })
  headerImageKey: string | null;

  @Column({ name: 'header_image_blurhash', type: 'text', nullable: true })
  headerImageBlurhash: string | null;

  @Column({ type: 'text', nullable: true })
  @Index() // Filtering by language
  lang: string | null;

  @Column({ name: 'lang_confidence', type: 'float', nullable: true })
  langConfidence: number | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index() // Feed sorting
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'reply_count', default: 0 })
  replyCount: number;

  @Column({ name: 'quote_count', default: 0 })
  quoteCount: number;

  @Column({ name: 'private_like_count', default: 0 })
  privateLikeCount: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'reading_time_minutes', type: 'float', default: 0 })
  readingTimeMinutes: number;

  @Column({ type: 'jsonb', nullable: true })
  media: {
    type: 'gif' | 'video';
    url?: string;
    key?: string;
    width?: number;
    height?: number;
  } | null;

  @OneToMany(() => PostEdge, (edge) => edge.fromPost)
  outgoingEdges: PostEdge[];

  @OneToMany(() => PostTopic, (pt) => pt.post)
  postTopics: PostTopic[];

  @OneToMany(() => Mention, (mention) => mention.post)
  mentions: Mention[];
}
