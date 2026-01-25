import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Collection } from './collection.entity';
import { Post } from './post.entity';

@Entity('collection_items')
export class CollectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'collection_id' })
  collectionId: string;

  @ManyToOne(() => Collection)
  @JoinColumn({ name: 'collection_id' })
  collection: Collection;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'curator_note', type: 'text', nullable: true })
  curatorNote: string;

  @Column({ name: 'added_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
