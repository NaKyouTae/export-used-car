import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
