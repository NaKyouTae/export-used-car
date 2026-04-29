import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { CreateMakeDto } from "./dto/create-make.dto";
import { UpdateCarModelDto } from "./dto/update-car-model.dto";
import { UpdateMakeDto } from "./dto/update-make.dto";

@Injectable()
export class MakesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.make.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: { select: { models: true } },
      },
    });
  }

  async findModels(makeId: string) {
    await this.ensureMakeExists(makeId);
    return this.prisma.carModel.findMany({
      where: { makeId },
      orderBy: { displayOrder: "asc" },
    });
  }

  async createMake(dto: CreateMakeDto) {
    return this.prisma.make.create({ data: dto });
  }

  async updateMake(id: string, dto: UpdateMakeDto) {
    await this.ensureMakeExists(id);
    return this.prisma.make.update({
      where: { id },
      data: dto,
    });
  }

  async removeMake(id: string) {
    await this.ensureMakeExists(id);

    const [carCount, modelCount] = await Promise.all([
      this.prisma.car.count({ where: { makeId: id } }),
      this.prisma.carModel.count({ where: { makeId: id } }),
    ]);

    if (carCount > 0 || modelCount > 0) {
      throw new ConflictException(
        "Cannot delete make with existing cars or models",
      );
    }

    return this.prisma.make.delete({ where: { id } });
  }

  async createModel(makeId: string, dto: CreateCarModelDto) {
    await this.ensureMakeExists(makeId);
    return this.prisma.carModel.create({
      data: { ...dto, makeId },
    });
  }

  async updateModel(id: string, dto: UpdateCarModelDto) {
    await this.ensureModelExists(id);
    return this.prisma.carModel.update({
      where: { id },
      data: dto,
    });
  }

  async removeModel(id: string) {
    await this.ensureModelExists(id);

    const carCount = await this.prisma.car.count({
      where: { modelId: id },
    });

    if (carCount > 0) {
      throw new ConflictException("Cannot delete model with existing cars");
    }

    return this.prisma.carModel.delete({ where: { id } });
  }

  private async ensureMakeExists(id: string) {
    const make = await this.prisma.make.findUnique({ where: { id } });
    if (!make) {
      throw new NotFoundException("Make not found");
    }
    return make;
  }

  private async ensureModelExists(id: string) {
    const model = await this.prisma.carModel.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException("Car model not found");
    }
    return model;
  }
}
