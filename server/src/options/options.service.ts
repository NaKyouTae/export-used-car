import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

  async createCategory(dto: CreateOptionCategoryDto) {
    const displayOrder = dto.displayOrder ?? (await this.nextCategoryOrder());
    return this.prisma.optionCategory.create({
      data: { ...dto, displayOrder },
    });
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

  async reorderCategories(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.optionCategory.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAllCategories();
  }

  // ── Option Items ──

  async createItem(dto: CreateOptionItemDto) {
    const displayOrder =
      dto.displayOrder ?? (await this.nextItemOrder(dto.categoryId));
    return this.prisma.optionItem.create({
      data: { ...dto, displayOrder },
    });
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

  async reorderItems(categoryId: string, ids: string[]) {
    const category = await this.prisma.optionCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException("Option category not found");
    }
    const existing = await this.prisma.optionItem.findMany({
      where: { id: { in: ids }, categoryId },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException("Some items not found in this category");
    }
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.optionItem.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.prisma.optionItem.findMany({
      where: { categoryId },
      orderBy: { displayOrder: "asc" },
    });
  }

  private async nextCategoryOrder() {
    const max = await this.prisma.optionCategory.aggregate({
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }

  private async nextItemOrder(categoryId: string) {
    const max = await this.prisma.optionItem.aggregate({
      where: { categoryId },
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }
}
