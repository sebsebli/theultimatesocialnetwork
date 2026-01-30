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

export type InviteStatus = 'PENDING' | 'ACTIVATED' | 'EXPIRED' | 'REVOKED';

@Entity('invites')
export class Invite {
  @PrimaryColumn('text')
  code: string;

  @Column({ name: 'creator_id', type: 'uuid', nullable: true })
  @Index()
  creatorId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'text', default: 'PENDING' })
  status: InviteStatus;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'last_sent_at', type: 'timestamp', nullable: true })
  lastSentAt: Date | null;

  @Column({ name: 'used_by_id', type: 'uuid', nullable: true })
  @Index()
  usedById: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'used_by_id' })
  usedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;
}
