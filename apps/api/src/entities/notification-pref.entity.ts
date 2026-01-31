import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('notification_prefs')
export class NotificationPref {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @Column({ default: true })
  replies: boolean;

  @Column({ default: true })
  quotes: boolean;

  @Column({ default: true })
  mentions: boolean;

  @Column({ default: true })
  dms: boolean;

  @Column({ default: true })
  follows: boolean;

  @Column({ default: false })
  saves: boolean;

  @Column({ name: 'quiet_hours_start', type: 'smallint', nullable: true })
  quietHoursStart: number;

  @Column({ name: 'quiet_hours_end', type: 'smallint', nullable: true })
  quietHoursEnd: number;

  /** Email: marketing and promotions. Default off; system messages (sign-in, security, account) are always sent. */
  @Column({ name: 'email_marketing', default: false })
  emailMarketing: boolean;

  /** Email: product updates and tips. Default off. */
  @Column({ name: 'email_product_updates', default: false })
  emailProductUpdates: boolean;
}
