import { IsOptional, IsEnum, IsString } from "class-validator";
import { CarStatus } from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class AdminCarsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;

  @IsOptional()
  @IsString()
  sellerId?: string;
}
