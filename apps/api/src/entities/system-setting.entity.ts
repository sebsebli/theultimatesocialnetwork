import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn('text')
  key: string;

  @Column('text')
  value: string; // JSON string or simple value

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
