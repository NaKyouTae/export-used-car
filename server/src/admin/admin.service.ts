import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, SellerStatus, CarStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AdminSellersQueryDto } from "./dto/admin-sellers-query.dto";
import { AdminCarsQueryDto } from "./dto/admin-cars-query.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  login(token: string) {
    const adminToken = this.config.get<string>("ADMIN_TOKEN");
    if (!token || token !== adminToken) {
      throw new UnauthorizedException("Invalid admin token");
    }
    return { success: true };
  }

  async getDashboard() {
    const [
      carsByStatus,
      sellersByStatus,
      totalBuyers,
      recentCars,
      recentSellers,
    ] = await Promise.all([
      this.prisma.car.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.prisma.seller.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.prisma.buyer.count(),
      this.prisma.car.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          priceMin: true,
          priceMax: true,
          createdAt: true,
          seller: { select: { companyName: true } },
        },
      }),
      this.prisma.seller.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          status: true,
          isVerified: true,
          createdAt: true,
        },
      }),
    ]);

    const carStatusCounts: Record<string, number> = {
      DRAFT: 0,
      ACTIVE: 0,
      RESERVED: 0,
      SOLD: 0,
    };
    for (const row of carsByStatus) {
      carStatusCounts[row.status] = row._count.id;
    }

    const sellerStatusCounts: Record<string, number> = {
      PENDING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
    };
    for (const row of sellersByStatus) {
      sellerStatusCounts[row.status] = row._count.id;
    }

    return {
      cars: {
        total: Object.values(carStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: carStatusCounts,
      },
      sellers: {
        total: Object.values(sellerStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: sellerStatusCounts,
      },
      buyers: { total: totalBuyers },
      recentCars,
      recentSellers,
    };
  }

  async findSellers(query: AdminSellersQueryDto) {
    const { status, cursor, limit = 20 } = query;

    const where: Prisma.SellerWhereInput = {};
    if (status) where.status = status;

    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
      where.AND = [
        {
          OR: [
            { createdAt: { lt: new Date(decoded.createdAt) } },
            {
              createdAt: new Date(decoded.createdAt),
              id: { lt: decoded.id },
            },
          ],
        },
      ];
    }

    const sellers = await this.prisma.seller.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        email: true,
        companyName: true,
        contactName: true,
        phone: true,
        businessNumber: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { cars: true } },
      },
    });

    const hasMore = sellers.length > limit;
    const data = hasMore ? sellers.slice(0, limit) : sellers;

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        }),
      ).toString("base64");
    }

    return { data, nextCursor };
  }

  async createSeller(data: {
    email: string;
    companyName: string;
    contactName: string;
    phone: string;
    businessNumber?: string;
    address?: string;
  }) {
    return this.prisma.seller.create({
      data: {
        email: data.email,
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        businessNumber: data.businessNumber,
        address: data.address,
        isVerified: true,
        status: SellerStatus.ACTIVE,
      },
    });
  }

  async updateSellerStatus(id: string, status: SellerStatus) {
    return this.prisma.seller.update({
      where: { id },
      data: { status },
    });
  }

  async findCars(query: AdminCarsQueryDto) {
    const { status, sellerId, cursor, limit = 20 } = query;

    const where: Prisma.CarWhereInput = {};
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;

    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
      where.AND = [
        {
          OR: [
            { createdAt: { lt: new Date(decoded.createdAt) } },
            {
              createdAt: new Date(decoded.createdAt),
              id: { lt: decoded.id },
            },
          ],
        },
      ];
    }

    const cars = await this.prisma.car.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        title: true,
        year: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        priceMin: true,
        priceMax: true,
        status: true,
        viewCount: true,
        createdAt: true,
        seller: { select: { companyName: true } },
        make: { select: { id: true, name: true, nameKo: true } },
        carModel: { select: { id: true, name: true, nameKo: true } },
      },
    });

    const hasMore = cars.length > limit;
    const data = hasMore ? cars.slice(0, limit) : cars;

    // Attach thumbnails
    const carIds = data.map((c) => c.id);
    const thumbnails = await this.prisma.image.findMany({
      where: {
        targetId: { in: carIds },
        imageCategory: "CAR_PHOTO",
      },
      orderBy: [{ isThumbnail: "desc" }, { order: "asc" }],
    });

    const thumbnailMap = new Map<string, string>();
    for (const img of thumbnails) {
      if (!thumbnailMap.has(img.targetId)) {
        thumbnailMap.set(img.targetId, img.url);
      }
    }

    const result = data.map((car) => ({
      ...car,
      thumbnail: thumbnailMap.get(car.id) || null,
    }));

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        }),
      ).toString("base64");
    }

    return { data: result, nextCursor };
  }

  async updateCarStatus(id: string, status: CarStatus) {
    return this.prisma.car.update({
      where: { id },
      data: { status },
    });
  }
}
