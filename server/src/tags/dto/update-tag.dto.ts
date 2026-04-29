import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateTagDto {
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
