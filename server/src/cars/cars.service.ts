import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { CarQueryDto, CarSort } from "./dto/car-query.dto";

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: CarQueryDto) {
    const {
      categoryId,
      makeId,
      modelId,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      fuelType,
      transmission,
      mileageMax,
      search,
      sort = CarSort.NEWEST,
      cursor,
      limit = 20,
    } = query;

    const where: Prisma.CarWhereInput = {
      status: "ACTIVE",
    };

    if (categoryId) where.categoryId = categoryId;
    if (makeId) where.makeId = makeId;
    if (modelId) where.modelId = modelId;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;

    if (yearMin || yearMax) {
      where.year = {};
      if (yearMin) where.year.gte = yearMin;
      if (yearMax) where.year.lte = yearMax;
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = priceMin;
      if (priceMax) where.price.lte = priceMax;
    }

    if (mileageMax) {
      where.mileage = { lte: mileageMax };
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    // Cursor decoding & pagination
    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
      const cursorCondition = this.buildCursorCondition(sort, decoded);
      where.AND = cursorCondition;
    }

    const orderBy = this.buildOrderBy(sort);

    const cars = await this.prisma.car.findMany({
      where,
      orderBy,
      take: limit + 1,
      select: {
        id: true,
        title: true,
        year: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        price: true,
        status: true,
        viewCount: true,
        wishlistCount: true,
        chatCount: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        make: { select: { id: true, name: true, nameKo: true } },
        carModel: { select: { id: true, name: true, nameKo: true } },
      },
    });

    const hasMore = cars.length > limit;
    const data = hasMore ? cars.slice(0, limit) : cars;

    // Attach thumbnail for each car
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
      nextCursor = this.encodeCursor(sort, last);
    }

    return { data: result, nextCursor };
  }

  async findOne(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        seller: { select: { companyName: true } },
        category: { select: { id: true, name: true } },
        make: { select: { id: true, name: true, nameKo: true } },
        carModel: { select: { id: true, name: true, nameKo: true } },
        options: {
          include: {
            optionItem: {
              include: { category: true },
            },
          },
        },
        tags: {
          include: { tag: true },
        },
        inspection: {
          select: {
            accidentRepairCount: true,
            simpleRepairCount: true,
            summary: true,
          },
        },
      },
    });

    if (!car) {
      throw new NotFoundException("Car not found");
    }

    // Increment viewCount
    await this.prisma.car.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch images
    const images = await this.prisma.image.findMany({
      where: { targetId: id, imageCategory: "CAR_PHOTO" },
      orderBy: [{ order: "asc" }],
    });

    return { ...car, images };
  }

  async create(dto: CreateCarDto, sellerId: string) {
    return this.prisma.car.create({
      data: {
        ...dto,
        sellerId,
      },
    });
  }

  async update(id: string, dto: UpdateCarDto, sellerId: string) {
    await this.ensureOwnership(id, sellerId);
    return this.prisma.car.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, sellerId: string) {
    await this.ensureOwnership(id, sellerId);

    // Delete all associated images from storage
    const images = await this.prisma.image.findMany({
      where: { targetId: id },
    });

    for (const image of images) {
      await this.storage.delete(image.url);
    }

    // Cascade handles DB deletions for options, tags, inspection, images
    await this.prisma.image.deleteMany({ where: { targetId: id } });
    return this.prisma.car.delete({ where: { id } });
  }

  async setOptions(id: string, optionItemIds: string[], sellerId: string) {
    await this.ensureOwnership(id, sellerId);

    return this.prisma.$transaction(async (tx) => {
      await tx.carOption.deleteMany({ where: { carId: id } });
      if (optionItemIds.length > 0) {
        await tx.carOption.createMany({
          data: optionItemIds.map((optionItemId) => ({
            carId: id,
            optionItemId,
          })),
        });
      }
      return tx.carOption.findMany({
        where: { carId: id },
        include: { optionItem: { include: { category: true } } },
      });
    });
  }

  async setTags(id: string, tagIds: string[], sellerId: string) {
    await this.ensureOwnership(id, sellerId);

    return this.prisma.$transaction(async (tx) => {
      await tx.carTag.deleteMany({ where: { carId: id } });
      if (tagIds.length > 0) {
        await tx.carTag.createMany({
          data: tagIds.map((tagId) => ({
            carId: id,
            tagId,
          })),
        });
      }
      return tx.carTag.findMany({
        where: { carId: id },
        include: { tag: true },
      });
    });
  }

  async findBySeller(sellerId: string, cursor?: string, limit = 20) {
    const where: Prisma.CarWhereInput = { sellerId };

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
        price: true,
        status: true,
        viewCount: true,
        wishlistCount: true,
        chatCount: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
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

  private async ensureOwnership(carId: string, sellerId: string) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      throw new NotFoundException("Car not found");
    }
    if (car.sellerId !== sellerId) {
      throw new ForbiddenException("You do not own this car");
    }
    return car;
  }

  private buildCursorCondition(sort: CarSort, decoded: any): any[] {
    switch (sort) {
      case CarSort.PRICE_ASC:
        return [
          {
            OR: [
              { price: { gt: decoded.price } },
              { price: decoded.price, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.PRICE_DESC:
        return [
          {
            OR: [
              { price: { lt: decoded.price } },
              { price: decoded.price, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.YEAR_DESC:
        return [
          {
            OR: [
              { year: { lt: decoded.year } },
              { year: decoded.year, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.MILEAGE_ASC:
        return [
          {
            OR: [
              { mileage: { gt: decoded.mileage } },
              { mileage: decoded.mileage, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.NEWEST:
      default:
        return [
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
  }

  private buildOrderBy(sort: CarSort): Prisma.CarOrderByWithRelationInput[] {
    switch (sort) {
      case CarSort.PRICE_ASC:
        return [{ price: "asc" }, { id: "desc" }];
      case CarSort.PRICE_DESC:
        return [{ price: "desc" }, { id: "desc" }];
      case CarSort.YEAR_DESC:
        return [{ year: "desc" }, { id: "desc" }];
      case CarSort.MILEAGE_ASC:
        return [{ mileage: "asc" }, { id: "desc" }];
      case CarSort.NEWEST:
      default:
        return [{ createdAt: "desc" }, { id: "desc" }];
    }
  }

  private encodeCursor(sort: CarSort, last: any): string {
    let payload: any;
    switch (sort) {
      case CarSort.PRICE_ASC:
      case CarSort.PRICE_DESC:
        payload = { price: last.price, id: last.id };
        break;
      case CarSort.YEAR_DESC:
        payload = { year: last.year, id: last.id };
        break;
      case CarSort.MILEAGE_ASC:
        payload = { mileage: last.mileage, id: last.id };
        break;
      case CarSort.NEWEST:
      default:
        payload = {
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        };
        break;
    }
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}
