import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSellerDto } from "./dto/update-seller.dto";

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.role !== "SELLER") {
      throw new NotFoundException("Seller not found");
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateSellerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.role !== "SELLER") {
      throw new NotFoundException("Seller not found");
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
