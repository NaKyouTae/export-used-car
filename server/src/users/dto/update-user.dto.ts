import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  // 공통
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(["EN", "KO"])
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  company?: string;

  // 셀러 전용 (role=SELLER일 때만 반영)
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  businessNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
