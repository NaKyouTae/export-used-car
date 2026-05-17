import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async toggle(userId: string, carId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_carId: { userId, carId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      await this.prisma.car.update({
        where: { id: carId },
        data: { wishlistCount: { decrement: 1 } },
      });
      return { wishlisted: false };
    }

    await this.prisma.wishlist.create({
      data: { userId, carId },
    });
    await this.prisma.car.update({
      where: { id: carId },
      data: { wishlistCount: { increment: 1 } },
    });
    return { wishlisted: true };
  }

  async isWishlisted(userId: string, carId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_carId: { userId, carId } },
    });
    return { wishlisted: !!existing };
  }

  async getMyWishlist(userId: string) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (wishlists.length === 0) return [];

    const carIds = wishlists.map((w) => w.carId);

    const cars = await this.prisma.car.findMany({
      where: { id: { in: carIds } },
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
        wishlistCount: true,
        chatCount: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        make: { select: { id: true, name: true } },
        carModel: { select: { id: true, name: true } },
      },
    });

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

    const carMap = new Map(cars.map((c) => [c.id, c]));
    return carIds
      .map((id) => {
        const car = carMap.get(id);
        if (!car) return null;
        return { ...car, thumbnail: thumbnailMap.get(id) || null };
      })
      .filter(Boolean);
  }
}
