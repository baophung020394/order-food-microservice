import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TableQR } from './table-qr.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  DIRTY = 'dirty',
}

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_number', unique: true, nullable: false })
  tableNumber: string;

  @Column({ name: 'seats', nullable: false })
  seats: number;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
    nullable: false,
  })
  status: TableStatus;

  @Column({ name: 'current_order_id', nullable: true })
  currentOrderId: string;

  @OneToMany(() => TableQR, (tableQR: TableQR) => tableQR.table, {
    cascade: true,
  })
  qrCodes: TableQR[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
