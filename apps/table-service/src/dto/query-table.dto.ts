import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TableStatus } from '../entities/table.entity';

export class QueryTableDto {
  @IsOptional()
  @Transform(({ value }): TableStatus | undefined =>
    value === '' ? undefined : (value as TableStatus),
  )
  @IsEnum(TableStatus)
  status?: TableStatus;

  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : (value as string),
  )
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === '' || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === '' || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

