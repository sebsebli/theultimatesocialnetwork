import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Security audit log for admin/moderator actions.
 * Records who did what, when, and to which resource.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** User who performed the action (admin/moderator). */
  @Column({ name: 'actor_id', type: 'uuid' })
  @Index()
  actorId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  /** Action performed (e.g. 'ban_user', 'unban_user', 'resolve_report', 'reindex_search', 'rebuild_graph'). */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  action: string;

  /** Type of resource affected (e.g. 'user', 'report', 'post', 'system'). */
  @Column({ name: 'resource_type', type: 'varchar', length: 50 })
  resourceType: string;

  /** ID of the resource affected (optional). */
  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  /** Additional details about the action (JSON). */
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  /** IP address of the actor. */
  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
