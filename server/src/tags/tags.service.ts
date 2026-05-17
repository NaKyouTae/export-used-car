import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  async create(dto: CreateTagDto) {
    const displayOrder = dto.displayOrder ?? (await this.nextDisplayOrder());
    return this.prisma.tag.create({ data: { ...dto, displayOrder } });
  }

  update(id: string, dto: UpdateTagDto) {
    return this.prisma.tag.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const refCount = await this.prisma.carTag.count({
      where: { tagId: id },
    });

    if (refCount > 0) {
      throw new ConflictException("Cannot delete tag referenced by car tags.");
    }

    return this.prisma.tag.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.tag.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAll();
  }

  private async nextDisplayOrder() {
    const max = await this.prisma.tag.aggregate({
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }
}
