import { IsEnum } from "class-validator";
import { CarStatus } from "@prisma/client";

export class UpdateCarStatusDto {
  @IsEnum(CarStatus)
  status: CarStatus;
}
