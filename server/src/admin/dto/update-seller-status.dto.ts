import { IsEnum } from "class-validator";
import { SellerStatus } from "@prisma/client";

export class UpdateSellerStatusDto {
  @IsEnum(SellerStatus)
  status: SellerStatus;
}
