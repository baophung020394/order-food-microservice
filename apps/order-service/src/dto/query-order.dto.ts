import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '../entities/order.entity';

export class QueryOrderDto {
  @IsOptional()
  @Transform(({ value }): OrderStatus | undefined => {
    if (!value || value === '') return undefined;
    // Handle array case (from query params)
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    // Convert to string and ensure lowercase to match enum values
    const statusValue = String(stringValue).toLowerCase().trim();
    // Check if it's a valid enum value
    const validValues = Object.values(OrderStatus) as string[];
    if (validValues.includes(statusValue)) {
      return statusValue as OrderStatus;
    }
    // Return original value to let validator show proper error message
    return stringValue as OrderStatus;
  })
  @IsEnum(OrderStatus, {
    message: `status must be one of the following values: ${Object.values(OrderStatus).join(', ')}`,
  })
  status?: OrderStatus;

  @IsOptional()
  @Transform(({ value }): string | undefined => {
    if (!value || value === '') return undefined;
    // Handle array case (from query params)
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    return String(stringValue);
  })
  @IsString()
  tableId?: string;

  @IsOptional()
  @Transform(({ value }): string | undefined => {
    if (!value || value === '') return undefined;
    const stringValue = Array.isArray(value)
      ? (value[0] as string)
      : (value as string);
    return String(stringValue);
  })
  @IsString()
  createdBy?: string;

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
