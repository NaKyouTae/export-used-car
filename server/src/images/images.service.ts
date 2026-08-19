import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ImageCategory } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { MAX_IMAGE_UPLOAD_BYTES } from "../common/upload/image-upload.options";
import { UploadImageDto } from "./dto/upload-image.dto";

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(file: Express.Multer.File, dto: UploadImageDto, userId: string) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image files are allowed");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException("Image is too large (max 10MB)");
    }

    await this.verifyOwnership(dto.imageCategory, dto.targetId, userId);

    const folder = `${dto.imageCategory}/${dto.targetId}`;
    const url = await this.storage.upload(file, folder);

    const maxOrder = await this.prisma.image.aggregate({
      where: {
        imageCategory: dto.imageCategory,
        targetId: dto.targetId,
      },
      _max: { order: true },
    });

    const order = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.image.create({
      data: {
        imageCategory: dto.imageCategory,
        targetId: dto.targetId,
        url,
        order,
        isThumbnail: order === 0,
      },
    });
  }

  async remove(id: string, userId: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException("Image not found");
    }

    await this.verifyOwnership(image.imageCategory, image.targetId, userId);

    await this.storage.delete(image.url);
    return this.prisma.image.delete({ where: { id } });
  }

  async reorder(imageIds: string[], userId: string) {
    if (imageIds.length === 0) return [];

    const images = await this.prisma.image.findMany({
      where: { id: { in: imageIds } },
    });

    if (images.length !== imageIds.length) {
      throw new NotFoundException("One or more images not found");
    }

    const first = images[0];
    await this.verifyOwnership(first.imageCategory, first.targetId, userId);

    const updates = imageIds.map((id, index) =>
      this.prisma.image.update({
        where: { id },
        data: {
          order: index,
          isThumbnail: index === 0,
        },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  private async verifyOwnership(
    imageCategory: ImageCategory,
    targetId: string,
    userId: string,
  ) {
    if (
      imageCategory === ImageCategory.CAR_PHOTO ||
      imageCategory === ImageCategory.CAR_DOCUMENT
    ) {
      const car = await this.prisma.car.findUnique({
        where: { id: targetId },
      });
      if (!car) {
        throw new NotFoundException("Car not found");
      }
      if (car.sellerId !== userId) {
        throw new ForbiddenException("You do not own this car");
      }
    }
  }
}
