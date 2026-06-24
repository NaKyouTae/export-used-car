import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOptionItemDto } from "./dto/create-option-item.dto";
import { UpdateOptionItemDto } from "./dto/update-option-item.dto";

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.optionItem.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  async create(dto: CreateOptionItemDto) {
    const displayOrder = dto.displayOrder ?? (await this.nextOrder());
    return this.prisma.optionItem.create({
      data: { ...dto, displayOrder },
    });
  }

  update(id: string, dto: UpdateOptionItemDto) {
    return this.prisma.optionItem.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const refCount = await this.prisma.carOption.count({
      where: { optionItemId: id },
    });

    if (refCount > 0) {
      throw new ConflictException(
        "Cannot delete option item referenced by car options.",
      );
    }

    return this.prisma.optionItem.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.optionItem.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAll();
  }

  private async nextOrder() {
    const max = await this.prisma.optionItem.aggregate({
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }
}
