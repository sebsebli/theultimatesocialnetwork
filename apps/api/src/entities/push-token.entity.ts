import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

export enum PushProvider {
  APNS = 'APNS',
  FCM = 'FCM',
}

@Entity('push_tokens')
@Unique(['provider', 'token'])
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: PushProvider,
    enumName: 'push_tokens_provider_enum',
  })
  provider: PushProvider;

  /**
   * Push token value (encrypted at rest via field-encryption).
   * The unique constraint (provider, token) uses the encrypted value.
   */
  @Column()
  token: string;

  /**
   * HMAC-SHA256 hash of the token for dedup/lookup without decryption.
   */
  @Column({ name: 'token_hash', type: 'text', nullable: true })
  @Index()
  tokenHash: string | null;

  @Column()
  platform: string;

  @Column({ name: 'device_id', type: 'text', nullable: true })
  deviceId: string;

  @Column({ name: 'app_version', type: 'text', nullable: true })
  appVersion: string;

  @Column({ type: 'text', nullable: true })
  locale: string;

  @Column({ name: 'apns_environment', type: 'text', nullable: true })
  apnsEnvironment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'last_seen_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastSeenAt: Date;

  @Column({ name: 'disabled_at', type: 'timestamp', nullable: true })
  disabledAt: Date | null;
}
