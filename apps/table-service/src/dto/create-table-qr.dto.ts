import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTableQRDto {
  @IsString()
  tableId: string;

  @IsString()
  qrToken: string;

  @IsString()
  @IsOptional()
  qrImageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
