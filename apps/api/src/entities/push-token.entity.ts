import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

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

  @Column({ type: 'enum', enum: PushProvider })
  provider: PushProvider;

  @Column()
  token: string;

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

  @Column({ name: 'last_seen_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSeenAt: Date;

  @Column({ name: 'disabled_at', type: 'timestamp', nullable: true })
  disabledAt: Date | null;
}
