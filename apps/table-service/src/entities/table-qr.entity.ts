import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Table } from './table.entity';

@Entity('table_qr')
export class TableQR {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_id', nullable: false })
  tableId: string;

  @ManyToOne(() => Table, (table) => table.qrCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @Column({ name: 'qr_token', unique: true, nullable: false })
  qrToken: string;

  @Column({ name: 'qr_image_url', nullable: true })
  qrImageUrl: string;

  @Column({ name: 'is_active', default: true, nullable: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

