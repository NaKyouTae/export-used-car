import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOptionCategoryDto } from "./dto/create-option-category.dto";
import { CreateOptionItemDto } from "./dto/create-option-item.dto";
import { UpdateOptionCategoryDto } from "./dto/update-option-category.dto";
import { UpdateOptionItemDto } from "./dto/update-option-item.dto";

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Option Categories ──

  findAllCategories() {
    return this.prisma.optionCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }

  createCategory(dto: CreateOptionCategoryDto) {
    return this.prisma.optionCategory.create({ data: dto });
  }

  updateCategory(id: string, dto: UpdateOptionCategoryDto) {
    return this.prisma.optionCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const itemCount = await this.prisma.optionItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      throw new ConflictException(
        "Cannot delete category with existing items. Remove items first.",
      );
    }

    return this.prisma.optionCategory.delete({ where: { id } });
  }

  // ── Option Items ──

  createItem(dto: CreateOptionItemDto) {
    return this.prisma.optionItem.create({ data: dto });
  }

  updateItem(id: string, dto: UpdateOptionItemDto) {
    return this.prisma.optionItem.update({ where: { id }, data: dto });
  }

  async deleteItem(id: string) {
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
}
