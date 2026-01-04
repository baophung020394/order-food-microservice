import { IsInt, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  seats?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsString()
  @IsOptional()
  currentOrderId?: string;
}

