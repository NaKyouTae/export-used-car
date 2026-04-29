import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterBuyerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
