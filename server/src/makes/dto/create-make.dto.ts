import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMakeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  nameKo?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
