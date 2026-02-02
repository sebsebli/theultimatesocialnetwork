import { Entity, PrimaryColumn, CreateDateColumn, Column } from 'typeorm';

@Entity('waiting_list')
export class WaitingList {
  @PrimaryColumn('text')
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'ip_hash', type: 'text', nullable: true }) // Hashed IP for spam prevention
  ipHash: string | null;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'INVITED'],
    default: 'PENDING',
    enumName: 'waiting_list_status_enum',
  })
  status: 'PENDING' | 'INVITED';
}
