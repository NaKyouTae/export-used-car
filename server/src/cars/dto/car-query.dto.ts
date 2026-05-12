import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { FuelType, Transmission } from "@prisma/client";

export enum CarSort {
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  YEAR_DESC = "year_desc",
  MILEAGE_ASC = "mileage_asc",
  NEWEST = "newest",
  POPULAR = "popular",
  WISHLIST = "wishlist",
}

export class CarQueryDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  makeId?: string;

  @IsString()
  @IsOptional()
  modelId?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  yearMin?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  yearMax?: number;

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

  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @IsEnum(Transmission)
  @IsOptional()
  transmission?: Transmission;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  mileageMax?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(CarSort)
  @IsOptional()
  sort?: CarSort = CarSort.NEWEST;

  @IsString()
  @IsOptional()
  cursor?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
