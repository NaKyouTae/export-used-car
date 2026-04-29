import { IsOptional, IsString } from "class-validator";

export class UpdateSellerDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  businessNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
