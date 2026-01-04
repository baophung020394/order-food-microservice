import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

