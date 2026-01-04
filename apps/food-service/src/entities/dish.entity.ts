import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

export enum DishStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'category_id',
    nullable: false,
  })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.dishes, {
    onDelete: 'RESTRICT', // Prevent deleting category if dishes exist
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: DishStatus,
    default: DishStatus.AVAILABLE,
    nullable: false,
  })
  status: DishStatus;

  @Column({ name: 'preparation_time', nullable: true })
  preparationTime: number; // In minutes

  @Column({ name: 'spice_level', nullable: true })
  spiceLevel: number; // 0-5 scale

  @Column({ name: 'is_vegetarian', default: false, nullable: false })
  isVegetarian: boolean;

  @Column({ name: 'is_vegan', default: false, nullable: false })
  isVegan: boolean;

  @Column({ name: 'is_gluten_free', default: false, nullable: false })
  isGlutenFree: boolean;

  @Column({ name: 'calories', nullable: true })
  calories: number;

  @Column({ name: 'display_order', default: 0, nullable: false })
  displayOrder: number; // For sorting dishes within category

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
