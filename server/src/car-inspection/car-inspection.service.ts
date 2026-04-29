import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertInspectionDto } from "./dto/upsert-inspection.dto";

@Injectable()
export class CarInspectionService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCarId(carId: string) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      throw new NotFoundException("Car not found");
    }

    const inspection = await this.prisma.carInspection.findUnique({
      where: { carId },
      include: { parts: true },
    });

    return inspection;
  }

  async upsert(carId: string, dto: UpsertInspectionDto, sellerId: string) {
    const car = await this.prisma.car.findUnique({ where: { id: carId } });
    if (!car) {
      throw new NotFoundException("Car not found");
    }
    if (car.sellerId !== sellerId) {
      throw new ForbiddenException("You do not own this car");
    }

    const { parts, inspectionDate, ...inspectionData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.carInspection.upsert({
        where: { carId },
        create: {
          carId,
          ...inspectionData,
          inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
        },
        update: {
          ...inspectionData,
          inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
        },
      });

      // Delete existing parts and recreate
      await tx.inspectionPart.deleteMany({
        where: { inspectionId: inspection.id },
      });

      if (parts.length > 0) {
        await tx.inspectionPart.createMany({
          data: parts.map((part) => ({
            inspectionId: inspection.id,
            partName: part.partName,
            status: part.status,
            note: part.note,
          })),
        });
      }

      return tx.carInspection.findUnique({
        where: { id: inspection.id },
        include: { parts: true },
      });
    });
  }
}
