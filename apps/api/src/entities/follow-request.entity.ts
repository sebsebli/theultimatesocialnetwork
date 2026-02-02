import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum FollowRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('follow_requests')
export class FollowRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({
    type: 'enum',
    enum: FollowRequestStatus,
    default: FollowRequestStatus.PENDING,
    enumName: 'follow_requests_status_enum',
  })
  status: FollowRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
