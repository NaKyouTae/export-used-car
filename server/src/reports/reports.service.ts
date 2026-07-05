import { Injectable, NotFoundException } from "@nestjs/common";
import { ReportTargetType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto } from "./dto/create-report.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto) {
    // 신고 대상이 실제 존재하는지 검증
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail?.trim() || null,
      },
    });

    return { id: report.id, ok: true };
  }

  private async assertTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    if (targetType === ReportTargetType.CAR) {
      const car = await this.prisma.car.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!car) throw new NotFoundException("Reported car not found");
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException("Reported user not found");
    }
  }
}
