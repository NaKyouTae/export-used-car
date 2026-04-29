import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOptionItemDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nameKo?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
