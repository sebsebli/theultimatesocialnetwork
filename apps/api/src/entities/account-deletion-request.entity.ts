import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('account_deletion_requests')
export class AccountDeletionRequest {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index({ unique: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', unique: true })
  @Index()
  token: string;

  /** Optional reason/feedback for why the user is deleting (stored for records). */
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  static createForUser(
    userId: string,
    reason: string | null,
    ttlHours: number = 24,
  ): AccountDeletionRequest {
    const req = new AccountDeletionRequest();
    req.id = uuidv4();
    req.userId = userId;
    req.token = uuidv4();
    req.reason = reason;
    req.expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return req;
  }
}
