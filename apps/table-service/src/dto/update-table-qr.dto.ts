import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTableQRDto {
  @IsString()
  @IsOptional()
  qrToken?: string;

  @IsString()
  @IsOptional()
  qrImageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

