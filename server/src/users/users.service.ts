import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.company !== undefined) data.company = dto.company;

    if (user.role === UserRole.SELLER) {
      if (dto.companyName !== undefined) data.companyName = dto.companyName;
      if (dto.contactName !== undefined) data.contactName = dto.contactName;
      if (dto.businessNumber !== undefined)
        data.businessNumber = dto.businessNumber;
      if (dto.address !== undefined) data.address = dto.address;
    }

    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
