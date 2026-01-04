import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
  @IsString()
  tableNumber: string;

  @IsInt()
  @Min(1)
  seats: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}
