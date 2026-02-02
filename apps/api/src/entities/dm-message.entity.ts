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
import { DmThread } from './dm-thread.entity';

@Entity('dm_messages')
export class DmMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'thread_id' })
  @Index()
  threadId: string;

  @ManyToOne(() => DmThread)
  @JoinColumn({ name: 'thread_id' })
  thread: DmThread;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column('text')
  body: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;
}
