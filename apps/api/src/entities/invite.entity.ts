import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('invites')
export class Invite {
  @PrimaryColumn('text')
  code: string;

  @Column({ name: 'creator_id', type: 'uuid', nullable: true }) // Null for system invites
  @Index()
  creatorId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

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
