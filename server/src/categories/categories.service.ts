import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { generateSlug } from "./slug.util";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  async create(dto: CreateCategoryDto) {
    const displayOrder = dto.displayOrder ?? (await this.nextDisplayOrder());
    const slug = dto.slug?.trim() || generateSlug(dto.name);
    return this.prisma.category.create({
      data: { name: dto.name, slug, displayOrder },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    const data: UpdateCategoryDto = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = generateSlug(dto.name);
    }
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const carCount = await this.prisma.car.count({
      where: { categoryId: id },
    });

    if (carCount > 0) {
      throw new ConflictException("Cannot delete category with existing cars");
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
    return this.findAll();
  }

  private async nextDisplayOrder() {
    const max = await this.prisma.category.aggregate({
      _max: { displayOrder: true },
    });
    return (max._max.displayOrder ?? -1) + 1;
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }
}
