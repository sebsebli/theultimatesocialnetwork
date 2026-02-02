import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  FOLLOW_REQUEST = 'FOLLOW_REQUEST',
  REPLY = 'REPLY',
  QUOTE = 'QUOTE',
  LIKE = 'LIKE',
  MENTION = 'MENTION',
  COLLECTION_ADD = 'COLLECTION_ADD',
  DM = 'DM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: [
      'FOLLOW',
      'FOLLOW_REQUEST',
      'REPLY',
      'QUOTE',
      'LIKE',
      'MENTION',
      'COLLECTION_ADD',
      'DM',
    ],
    enumName: 'notifications_type_enum',
  })
  type: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId: string | null;

  @Column({ name: 'reply_id', type: 'uuid', nullable: true })
  replyId: string | null;

  @Column({ name: 'collection_id', type: 'uuid', nullable: true })
  collectionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;
}
