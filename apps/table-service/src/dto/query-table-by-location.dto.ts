import { IsInt, IsOptional, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryTableByLocationDto {
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
