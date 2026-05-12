import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { FuelType, Transmission, Drivetrain, CarStatus } from "@prisma/client";

export class UpdateCarDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  makeId?: string;

  @IsString()
  @IsOptional()
  modelId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  trim?: string;

  @IsString()
  @IsOptional()
  subTrim?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  registrationDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  mileage?: number;

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsEnum(Transmission)
  @IsOptional()
  transmission?: Transmission;

  @IsEnum(Drivetrain)
  @IsOptional()
  drivetrain?: Drivetrain;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displacement?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  plateNumber?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceMin?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priceMax?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CarStatus)
  @IsOptional()
  status?: CarStatus;
}
