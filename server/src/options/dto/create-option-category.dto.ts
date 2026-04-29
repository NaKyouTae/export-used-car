import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOptionCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
