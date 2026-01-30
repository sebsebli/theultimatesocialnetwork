import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ReportTargetType {
  POST = 'POST',
  REPLY = 'REPLY',
  USER = 'USER',
  DM = 'DM',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  REVIEWED = 'REVIEWED',
  ACTIONED = 'ACTIONED',
  DISMISSED = 'DISMISSED',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({
    type: 'enum',
    enum: ReportTargetType,
    name: 'target_type',
  })
  targetType: ReportTargetType;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column('text')
  reason: string;

  /** Optional details from the reporter (all languages). */
  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;
}
