import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { KeywordAlertsService } from "../keyword-alerts/keyword-alerts.service";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { CarQueryDto, CarSort } from "./dto/car-query.dto";

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly keywordAlerts: KeywordAlertsService,
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

    if (priceMin != null) {
      where.priceMin = { gte: priceMin };
    }
    if (priceMax != null) {
      where.priceMax = { lte: priceMax };
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
        registrationDate: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        drivetrain: true,
        seats: true,
        priceMin: true,
        priceMax: true,
        status: true,
        viewCount: true,
        wishlistCount: true,
        chatCount: true,
        bumpedAt: true,
        createdAt: true,
        seller: { select: { companyName: true } },
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
      nextCursor = this.encodeCursor(sort, last);
    }

    return { data: result, nextCursor };
  }

  async findOne(id: string, viewerId?: string) {
    const car = await this.prisma.car.findFirst({
      where: { id, deletedAt: null },
      include: {
        seller: { select: { id: true, companyName: true, contactName: true } },
        category: { select: { id: true, name: true } },
        make: { select: { id: true, name: true, nameKo: true } },
        carModel: { select: { id: true, name: true, nameKo: true } },
        options: {
          include: {
            optionItem: true,
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

    // Increment viewCount (skip when the seller views their own car)
    if (viewerId !== car.sellerId) {
      await this.prisma.car.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Fetch images
    const images = await this.prisma.image.findMany({
      where: { targetId: id, imageCategory: "CAR_PHOTO" },
      orderBy: [{ order: "asc" }],
    });

    const normalizedImages = images.map((img) => ({
      ...img,
      url: this.storage.normalizeUrl(img.url),
    }));

    return { ...car, images: normalizedImages };
  }

  async create(dto: CreateCarDto, sellerId: string) {
    // 최초 등록 시 bumpedAt을 createdAt과 동일한 값으로 기입한다(끌어올리기 전까지 등록일 기준 정렬).
    const now = new Date();
    const car = await this.prisma.car.create({
      data: {
        ...dto,
        // Json 필드는 Prisma InputJsonValue 로 캐스팅 (undefined면 미저장)
        damageMarks: dto.damageMarks as Prisma.InputJsonValue | undefined,
        sellerId,
        createdAt: now,
        bumpedAt: now,
      },
    });

    // 키워드 알림: 등록된 관심 키워드가 제목에 포함되는 유저들에게 비동기로 알림.
    void this.keywordAlerts.notifyNewCar({
      id: car.id,
      title: car.title,
      sellerId,
    });

    return car;
  }

  async update(id: string, dto: UpdateCarDto, sellerId: string) {
    await this.ensureOwnership(id, sellerId);
    // 정렬 기준은 전용 bumpedAt이므로, 일반 수정·상태 변경은 목록 위치에 영향을 주지 않는다.
    return this.prisma.car.update({
      where: { id },
      data: {
        ...dto,
        // undefined면 미변경, []면 전체 삭제로 반영
        damageMarks: dto.damageMarks as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // 끌어올리기: bumpedAt을 현재 시각으로 갱신해 최신순 목록 맨 위로 올린다.
  async bump(id: string, sellerId: string) {
    await this.ensureOwnership(id, sellerId);
    return this.prisma.car.update({
      where: { id },
      data: { bumpedAt: new Date() },
    });
  }

  async remove(id: string, sellerId: string) {
    await this.ensureOwnership(id, sellerId);

    // Soft delete: 실제 레코드/이미지를 지우지 않고 상태만 DELETED로 전환한다.
    // 복구 가능성을 위해 연관 데이터(이미지·옵션·태그)는 그대로 보존한다.
    return this.prisma.car.update({
      where: { id },
      data: { status: "DELETED", deletedAt: new Date() },
    });
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
        include: { optionItem: true },
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
    const where: Prisma.CarWhereInput = { sellerId, deletedAt: null };

    if (cursor) {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );
      where.AND = [
        {
          OR: [
            { bumpedAt: { lt: new Date(decoded.bumpedAt) } },
            {
              bumpedAt: new Date(decoded.bumpedAt),
              id: { lt: decoded.id },
            },
          ],
        },
      ];
    }

    const cars = await this.prisma.car.findMany({
      where,
      orderBy: [{ bumpedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        title: true,
        year: true,
        registrationDate: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        drivetrain: true,
        seats: true,
        priceMin: true,
        priceMax: true,
        status: true,
        viewCount: true,
        wishlistCount: true,
        chatCount: true,
        bumpedAt: true,
        createdAt: true,
        seller: { select: { companyName: true } },
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
          bumpedAt: last.bumpedAt.toISOString(),
          id: last.id,
        }),
      ).toString("base64");
    }

    return { data: result, nextCursor };
  }

  private async ensureOwnership(carId: string, sellerId: string) {
    const car = await this.prisma.car.findFirst({
      where: { id: carId, deletedAt: null },
    });
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
              { priceMin: { gt: decoded.priceMin } },
              { priceMin: decoded.priceMin, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.PRICE_DESC:
        return [
          {
            OR: [
              { priceMin: { lt: decoded.priceMin } },
              { priceMin: decoded.priceMin, id: { lt: decoded.id } },
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
      case CarSort.POPULAR:
        return [
          {
            OR: [
              { viewCount: { lt: decoded.viewCount } },
              { viewCount: decoded.viewCount, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.WISHLIST:
        return [
          {
            OR: [
              { wishlistCount: { lt: decoded.wishlistCount } },
              { wishlistCount: decoded.wishlistCount, id: { lt: decoded.id } },
            ],
          },
        ];
      case CarSort.NEWEST:
      default:
        return [
          {
            OR: [
              { bumpedAt: { lt: new Date(decoded.bumpedAt) } },
              {
                bumpedAt: new Date(decoded.bumpedAt),
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
        return [{ priceMin: "asc" }, { id: "desc" }];
      case CarSort.PRICE_DESC:
        return [{ priceMin: "desc" }, { id: "desc" }];
      case CarSort.YEAR_DESC:
        return [{ year: "desc" }, { id: "desc" }];
      case CarSort.MILEAGE_ASC:
        return [{ mileage: "asc" }, { id: "desc" }];
      case CarSort.POPULAR:
        return [{ viewCount: "desc" }, { id: "desc" }];
      case CarSort.WISHLIST:
        return [{ wishlistCount: "desc" }, { id: "desc" }];
      case CarSort.NEWEST:
      default:
        return [{ bumpedAt: "desc" }, { id: "desc" }];
    }
  }

  private encodeCursor(sort: CarSort, last: any): string {
    let payload: any;
    switch (sort) {
      case CarSort.PRICE_ASC:
      case CarSort.PRICE_DESC:
        payload = { priceMin: last.priceMin, id: last.id };
        break;
      case CarSort.YEAR_DESC:
        payload = { year: last.year, id: last.id };
        break;
      case CarSort.MILEAGE_ASC:
        payload = { mileage: last.mileage, id: last.id };
        break;
      case CarSort.POPULAR:
        payload = { viewCount: last.viewCount, id: last.id };
        break;
      case CarSort.WISHLIST:
        payload = { wishlistCount: last.wishlistCount, id: last.id };
        break;
      case CarSort.NEWEST:
      default:
        payload = {
          bumpedAt: last.bumpedAt.toISOString(),
          id: last.id,
        };
        break;
    }
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}
