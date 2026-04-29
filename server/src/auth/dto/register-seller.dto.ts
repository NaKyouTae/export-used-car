import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterSellerDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  businessNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
