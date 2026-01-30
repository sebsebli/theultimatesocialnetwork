import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('data_exports')
export class DataExport {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  token: string;

  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  static createForUser(
    userId: string,
    storageKey: string,
    ttlDays: number = 7,
  ): DataExport {
    const e = new DataExport();
    e.id = uuidv4();
    e.userId = userId;
    e.token = uuidv4().replace(/-/g, '');
    e.storageKey = storageKey;
    e.expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    return e;
  }
}
