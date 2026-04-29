import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSellerDto } from "./dto/update-seller.dto";

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      throw new NotFoundException("Seller not found");
    }
    return seller;
  }

  async updateMe(sellerId: string, dto: UpdateSellerDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      throw new NotFoundException("Seller not found");
    }
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: dto,
    });
  }
}
