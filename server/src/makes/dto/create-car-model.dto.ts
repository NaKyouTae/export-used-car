import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCarModelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
