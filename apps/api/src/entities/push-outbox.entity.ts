import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum PushStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  SUPPRESSED = 'suppressed',
}

@Entity('push_outbox')
export class PushOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'notif_type' })
  notifType: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ type: 'jsonb', default: {} })
  data: any;

  @Column({ default: 'normal' })
  priority: string;

  @Column({
    type: 'enum',
    enum: PushStatus,
    default: PushStatus.PENDING,
  })
  status: PushStatus;

  @Column({ name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;
}
