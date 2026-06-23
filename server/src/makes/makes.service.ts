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
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async createMake(dto: CreateMakeDto) {
    const displayOrder = dto.displayOrder ?? (await this.nextMakeOrder());
    return this.prisma.make.create({ data: { ...dto, displayOrder } });
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

  async reorderMakes(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.make.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAll();
  }

  async createModel(makeId: string, dto: CreateCarModelDto) {
    await this.ensureMakeExists(makeId);
    const displayOrder =
      dto.displayOrder ?? (await this.nextModelOrder(makeId));
    return this.prisma.carModel.create({
      data: { ...dto, displayOrder, makeId },
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

  async reorderModels(makeId: string, ids: string[]) {
    await this.ensureMakeExists(makeId);
    const existing = await this.prisma.carModel.findMany({
      where: { id: { in: ids }, makeId },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some models not found in this make");
    }
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.carModel.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findModels(makeId);
  }

  private async nextMakeOrder() {
    const max = await this.prisma.make.aggregate({
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }

  private async nextModelOrder(makeId: string) {
    const max = await this.prisma.carModel.aggregate({
      where: { makeId },
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
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
