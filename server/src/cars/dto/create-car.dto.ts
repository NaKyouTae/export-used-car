import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { FuelType, Transmission, Drivetrain, CarStatus } from "@prisma/client";

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  makeId: string;

  @IsString()
  @IsNotEmpty()
  modelId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  trim?: string;

  @IsString()
  @IsOptional()
  subTrim?: string;

  @Type(() => Number)
  @IsInt()
  year: number;

  @IsString()
  @IsOptional()
  registrationDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage: number;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsEnum(Transmission)
  transmission: Transmission;

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
  priceMin: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CarStatus)
  @IsOptional()
  status?: CarStatus;
}
