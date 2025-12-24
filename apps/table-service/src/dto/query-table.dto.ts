import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '../entities/table.entity';

export class QueryTableDto {
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

