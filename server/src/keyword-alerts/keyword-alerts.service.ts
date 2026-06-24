import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class KeywordAlertsService {
  private readonly logger = new Logger(KeywordAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string) {
    return this.prisma.keywordAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, rawKeyword: string) {
    const keyword = rawKeyword?.trim().slice(0, 50);
    if (!keyword) {
      throw new ForbiddenException("Keyword is required");
    }

    try {
      return await this.prisma.keywordAlert.create({
        data: { userId, keyword },
      });
    } catch (err) {
      // 같은 유저가 동일 키워드를 다시 등록하면 기존 것을 그대로 반환한다.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return this.prisma.keywordAlert.findFirst({
          where: { userId, keyword },
        });
      }
      throw err;
    }
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.keywordAlert.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Keyword alert not found");
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    await this.prisma.keywordAlert.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * 새 차량이 등록되면 호출. 등록된 키워드가 차량 제목에 (대소문자 무시) 포함되는
   * 모든 유저에게 인앱 알림 + 푸시를 보낸다.
   * - 본인이 올린 매물은 본인에게 알리지 않는다.
   * - 한 유저가 여러 키워드로 매칭돼도 차량당 알림 1건만 보낸다.
   * 발송 실패가 차량 등록을 막지 않도록 예외를 던지지 않는다.
   */
  async notifyNewCar(car: { id: string; title: string; sellerId: string }) {
    try {
      const title = car.title.toLowerCase();

      // MVP 규모: 전체 키워드를 메모리에서 매칭한다. 규모가 커지면 ILIKE 기반으로 전환.
      const alerts = await this.prisma.keywordAlert.findMany({
        select: { userId: true, keyword: true },
      });

      const matchedByUser = new Map<string, string>();
      for (const a of alerts) {
        if (a.userId === car.sellerId) continue;
        if (matchedByUser.has(a.userId)) continue;
        if (title.includes(a.keyword.toLowerCase())) {
          matchedByUser.set(a.userId, a.keyword);
        }
      }

      for (const [userId, keyword] of matchedByUser) {
        await this.notifications.createAndPush({
          userId,
          type: "KEYWORD_MATCH",
          title: "관심 키워드 새 매물",
          body: `'${keyword}' 키워드와 일치하는 차량이 등록되었어요: ${car.title}`,
          data: { carId: car.id, keyword },
        });
      }
    } catch (err) {
      this.logger.error("키워드 알림 발송 중 오류", err as Error);
    }
  }
}
