import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsInt,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DishStatus } from '../entities/dish.entity';

export class QueryDishDto {
  @IsOptional()
  @Transform(({ value }): DishStatus | undefined => {
    if (!value || value === '') return undefined;
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    const statusValue = String(stringValue).toLowerCase().trim();
    const validValues = Object.values(DishStatus) as string[];
    if (validValues.includes(statusValue)) {
      return statusValue as DishStatus;
    }
    return stringValue as DishStatus;
  })
  @IsEnum(DishStatus)
  status?: DishStatus;

  @IsOptional()
  @Transform(({ value }): string | undefined => {
    if (!value || value === '') return undefined;
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    return String(stringValue);
  })
  @IsString()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }): boolean | undefined => {
    if (value === '' || value === undefined) return undefined;
    const boolValue = Array.isArray(value)
      ? (value[0] as string | boolean)
      : (value as string | boolean);
    if (boolValue === 'true' || boolValue === true) return true;
    if (boolValue === 'false' || boolValue === false) return false;
    return undefined;
  })
  @Type(() => Boolean)
  @IsBoolean()
  isVegetarian?: boolean;

  @IsOptional()
  @Transform(({ value }): boolean | undefined => {
    if (value === '' || value === undefined) return undefined;
    const boolValue = Array.isArray(value)
      ? (value[0] as string | boolean)
      : (value as string | boolean);
    if (boolValue === 'true' || boolValue === true) return true;
    if (boolValue === 'false' || boolValue === false) return false;
    return undefined;
  })
  @Type(() => Boolean)
  @IsBoolean()
  isVegan?: boolean;

  @IsOptional()
  @Transform(({ value }): boolean | undefined => {
    if (value === '' || value === undefined) return undefined;
    const boolValue = Array.isArray(value)
      ? (value[0] as string | boolean)
      : (value as string | boolean);
    if (boolValue === 'true' || boolValue === true) return true;
    if (boolValue === 'false' || boolValue === false) return false;
    return undefined;
  })
  @Type(() => Boolean)
  @IsBoolean()
  isGlutenFree?: boolean;

  @IsOptional()
  @Transform(({ value }): string | undefined => {
    if (!value || value === '') return undefined;
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    return String(stringValue);
  })
  @IsString()
  search?: string; // Search by name or description

  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === '' || value === undefined) return undefined;
    const numValue = Array.isArray(value)
      ? (value[0] as string | number)
      : (value as string | number);
    const num = Number(numValue);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === '' || value === undefined) return undefined;
    const numValue = Array.isArray(value)
      ? (value[0] as string | number)
      : (value as string | number);
    const num = Number(numValue);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
