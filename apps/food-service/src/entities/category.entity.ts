import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dish } from './dish.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', unique: true, nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'display_order', default: 0, nullable: false })
  displayOrder: number; // For sorting categories in menu

  @Column({ name: 'is_active', default: true, nullable: false })
  isActive: boolean;

  @OneToMany(() => Dish, (dish) => dish.category, {
    cascade: false,
  })
  dishes: Dish[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
