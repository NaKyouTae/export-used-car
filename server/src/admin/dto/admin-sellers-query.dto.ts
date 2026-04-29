import { IsOptional, IsEnum } from "class-validator";
import { SellerStatus } from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class AdminSellersQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SellerStatus)
  status?: SellerStatus;
}
