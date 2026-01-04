import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsUUID()
  dishId: string;

  @IsString()
  dishName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

