import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuickPhrasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.quickPhrase.findMany({
      where: { userId },
      orderBy: [
        { category: "asc" },
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });
  }

  async create(
    userId: string,
    data: { content: string; category?: string; displayOrder?: number },
  ) {
    const content = data.content?.trim();
    if (!content) {
      throw new ForbiddenException("Content is required");
    }
    const category = (data.category?.trim() || "General").slice(0, 50);

    return this.prisma.quickPhrase.create({
      data: {
        userId,
        content: content.slice(0, 500),
        category,
        displayOrder: data.displayOrder ?? 0,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: { content?: string; category?: string; displayOrder?: number },
  ) {
    const existing = await this.prisma.quickPhrase.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Phrase not found");
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const patch: Record<string, unknown> = {};
    if (typeof data.content === "string") {
      const content = data.content.trim();
      if (!content) throw new ForbiddenException("Content is required");
      patch.content = content.slice(0, 500);
    }
    if (typeof data.category === "string") {
      patch.category = (data.category.trim() || "General").slice(0, 50);
    }
    if (typeof data.displayOrder === "number") {
      patch.displayOrder = data.displayOrder;
    }

    return this.prisma.quickPhrase.update({ where: { id }, data: patch });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.quickPhrase.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Phrase not found");
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    await this.prisma.quickPhrase.delete({ where: { id } });
    return { ok: true };
  }
}
