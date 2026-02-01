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
}
