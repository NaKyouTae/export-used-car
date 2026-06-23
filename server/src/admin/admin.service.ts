import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CarStatus, Prisma, SellerStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { AdminCarsQueryDto } from "./dto/admin-cars-query.dto";
import { AdminSellersQueryDto } from "./dto/admin-sellers-query.dto";
import { AdminUsersQueryDto } from "./dto/admin-users-query.dto";
import { PromoteToSellerDto } from "./dto/promote-to-seller.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
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
      totalUsers,
      totalBuyers,
      recentCars,
      recentSellers,
    ] = await Promise.all([
      this.prisma.car.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ["sellerStatus"],
        where: { role: UserRole.SELLER },
        _count: { id: true },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.BUYER } }),
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
      this.prisma.user.findMany({
        where: { role: UserRole.SELLER },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          sellerStatus: true,
          isVerified: true,
          createdAt: true,
        },
      }),
    ]);

    const carStatusCounts: Record<string, number> = {
      DRAFT: 0,
      ACTIVE: 0,
      DEALING: 0,
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
    let totalSellers = 0;
    for (const row of sellersByStatus) {
      const key = row.sellerStatus ?? "ACTIVE";
      sellerStatusCounts[key] = row._count.id;
      totalSellers += row._count.id;
    }

    return {
      cars: {
        total: Object.values(carStatusCounts).reduce((a, b) => a + b, 0),
        byStatus: carStatusCounts,
      },
      sellers: {
        total: totalSellers,
        byStatus: sellerStatusCounts,
      },
      users: { total: totalUsers },
      buyers: { total: totalBuyers },
      recentCars,
      recentSellers: recentSellers.map((s) => ({
        ...s,
        status: s.sellerStatus,
      })),
    };
  }

  async findUsers(query: AdminUsersQueryDto) {
    const { role, search, cursor, limit = 20 } = query;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

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

    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        company: true,
        role: true,
        companyName: true,
        contactName: true,
        sellerStatus: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;

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

  async promoteToSeller(userId: string, dto: PromoteToSellerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.SELLER) {
      throw new BadRequestException("User is already a seller");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: UserRole.SELLER,
        companyName: dto.companyName,
        contactName: dto.contactName,
        phone: dto.phone,
        businessNumber: dto.businessNumber,
        address: dto.address,
        isVerified: true,
        sellerStatus: SellerStatus.ACTIVE,
      },
    });
  }

  async findSellers(query: AdminSellersQueryDto) {
    const { status, cursor, limit = 20 } = query;

    const where: Prisma.UserWhereInput = { role: UserRole.SELLER };
    if (status) where.sellerStatus = status;

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

    const sellers = await this.prisma.user.findMany({
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
        sellerStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { cars: true } },
      },
    });

    const hasMore = sellers.length > limit;
    const data = (hasMore ? sellers.slice(0, limit) : sellers).map((s) => ({
      ...s,
      status: s.sellerStatus,
    }));

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = sellers[limit - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        }),
      ).toString("base64");
    }

    return { data, nextCursor };
  }

  async updateSellerStatus(id: string, status: SellerStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== UserRole.SELLER) {
      throw new NotFoundException("Seller not found");
    }
    return this.prisma.user.update({
      where: { id },
      data: { sellerStatus: status },
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
        thumbnailMap.set(img.targetId, this.storage.normalizeUrl(img.url));
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
