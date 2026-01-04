import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { DishStatus } from '../entities/dish.entity';

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(DishStatus)
  @IsOptional()
  status?: DishStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  preparationTime?: number;

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  spiceLevel?: number;

  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @IsBoolean()
  @IsOptional()
  isGlutenFree?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  calories?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
