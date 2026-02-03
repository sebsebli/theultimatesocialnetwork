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

@Entity('email_change_requests')
export class EmailChangeRequest {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index({ unique: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'new_email', type: 'text' })
  newEmail: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  token: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  static createForUser(
    userId: string,
    newEmail: string,
    ttlHours: number = 24,
  ): EmailChangeRequest {
    const req = new EmailChangeRequest();
    req.id = uuidv4();
    req.userId = userId;
    req.newEmail = newEmail;
    req.token = uuidv4();
    req.expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return req;
  }
}
