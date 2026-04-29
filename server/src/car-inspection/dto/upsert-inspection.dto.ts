import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PartStatus } from "@prisma/client";

export class InspectionPartDto {
  @IsString()
  @IsNotEmpty()
  partName: string;

  @IsEnum(PartStatus)
  status: PartStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpsertInspectionDto {
  @IsString()
  @IsOptional()
  inspectionNumber?: string;

  @IsDateString()
  @IsOptional()
  inspectionDate?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  accidentRepairCount?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  simpleRepairCount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionPartDto)
  parts: InspectionPartDto[];
}
