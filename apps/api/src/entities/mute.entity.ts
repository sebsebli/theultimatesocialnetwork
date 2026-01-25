import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('mutes')
export class Mute {
  @PrimaryColumn({ name: 'muter_id' })
  muterId: string;

  @PrimaryColumn({ name: 'muted_id' })
  mutedId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'muter_id' })
  muter: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'muted_id' })
  muted: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
