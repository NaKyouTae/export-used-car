import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOptionCategoryDto {
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
