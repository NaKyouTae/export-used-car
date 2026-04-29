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

  create(dto: CreateTagDto) {
    return this.prisma.tag.create({ data: dto });
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
}
