import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOptionItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  nameKo?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
