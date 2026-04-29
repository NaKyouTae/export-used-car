import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateCarModelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameKo?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
