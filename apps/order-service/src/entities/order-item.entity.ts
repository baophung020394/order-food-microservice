import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', nullable: false })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'dish_id', nullable: false })
  dishId: string; // Reference to menu item (will integrate with menu-service later)

  @Column({ name: 'dish_name', nullable: false })
  dishName: string; // Store dish name for historical records

  @Column({ name: 'quantity', nullable: false, default: 1 })
  quantity: number;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number; // Price at time of order (for historical accuracy)

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string; // Special instructions for this item

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

