import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** Reason code for moderation (used for filtering and analytics). */
export enum ModerationReasonCode {
  SPAM = 'SPAM',
  ADVERTISING = 'ADVERTISING',
  HARASSMENT = 'HARASSMENT',
  REPEATED = 'REPEATED',
  VIOLENCE = 'VIOLENCE',
  HATE = 'HATE',
  OTHER = 'OTHER',
}

/** Content type that was moderated. */
export enum ModerationTargetType {
  POST = 'POST',
  REPLY = 'REPLY',
}

/** How the moderation was triggered. */
export enum ModerationSource {
  /** Async check in post/reply worker. */
  ASYNC_CHECK = 'ASYNC_CHECK',
  /** Report threshold + AI check. */
  REPORT_THRESHOLD = 'REPORT_THRESHOLD',
}

/** Status of a moderation appeal (DSA Art. 20). */
export enum AppealStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  UPHELD = 'UPHELD',
  REJECTED = 'REJECTED',
}

@Entity('moderation_records')
export class ModerationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ModerationTargetType,
    name: 'target_type',
  })
  @Index()
  targetType: ModerationTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  @Index()
  targetId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index()
  authorId: string;

  /** Normalized reason code (SPAM, ADVERTISING, HARASSMENT, etc.). */
  @Column({
    name: 'reason_code',
    type: 'enum',
    enum: ModerationReasonCode,
  })
  reasonCode: ModerationReasonCode;

  /** Human-readable reason from classifier/AI (e.g. "Spam detected.", "Excessive advertising"). */
  @Column({ name: 'reason_text', type: 'text' })
  reasonText: string;

  /** Confidence score 0–1 from AI/classifier. */
  @Column({ name: 'confidence', type: 'float' })
  confidence: number;

  /** Snapshot of the blocked content (post/reply body) for review. */
  @Column({ name: 'content_snapshot', type: 'text' })
  contentSnapshot: string;

  @Column({
    type: 'enum',
    enum: ModerationSource,
    name: 'source',
  })
  source: ModerationSource;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  /** Whether the author was notified (DSA Art. 17). */
  @Column({ name: 'notified', default: false })
  notified: boolean;

  /* ── Appeal fields (DSA Art. 20) ── */

  @Column({
    name: 'appeal_status',
    type: 'enum',
    enum: AppealStatus,
    default: AppealStatus.NONE,
  })
  appealStatus: AppealStatus;

  /** User-submitted appeal text. */
  @Column({ name: 'appeal_text', type: 'text', nullable: true })
  appealText: string | null;

  @Column({ name: 'appealed_at', type: 'timestamp', nullable: true })
  appealedAt: Date | null;

  @Column({ name: 'appeal_resolved_at', type: 'timestamp', nullable: true })
  appealResolvedAt: Date | null;

  /** Admin resolution note for the appeal. */
  @Column({ name: 'appeal_resolution', type: 'text', nullable: true })
  appealResolution: string | null;
}
