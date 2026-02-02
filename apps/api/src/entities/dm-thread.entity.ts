import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dm_threads')
export class DmThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_a' })
  userA: string;

  @Column({ name: 'user_b' })
  userB: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
