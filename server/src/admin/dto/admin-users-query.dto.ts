import { IsOptional, IsEnum, IsString } from "class-validator";
import { UserRole } from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class AdminUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  search?: string;
}
