import { Injectable, Logger } from "@nestjs/common";
import { NotificationType, Platform, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FcmService } from "./push/fcm.service";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** 딥링크 등 클라이언트가 사용할 payload. FCM data로도 직렬화되어 전달된다. */
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcm: FcmService,
  ) {}

  // ── 디바이스 토큰 ──────────────────────────────────────────

  /** 로그인/앱 시작 시 호출. token 기준 upsert로 유저·활성 상태를 최신화한다. */
  async registerToken(userId: string, token: string, platform: Platform) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, isActive: true, lastUsedAt: new Date() },
    });
  }

  /** 로그아웃 시 호출. 행 삭제 대신 비활성화. */
  async removeToken(token: string) {
    await this.prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    return { ok: true };
  }

  // ── 알림함 ────────────────────────────────────────────────

  async list(userId: string, limit = 20, cursor?: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNext = items.length > limit;
    const page = hasNext ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasNext ? page[page.length - 1].id : null,
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  // ── 생성 + 발송 (핵심 오케스트레이션) ──────────────────────

  /**
   * 1) 인앱 알림함에 레코드 생성(발송 성공 여부와 무관하게 항상 남는다)
   * 2) 유저의 활성 디바이스 토큰으로 FCM 발송
   * 3) 무효 토큰은 비활성화
   * 푸시 발송 실패가 호출측(채팅 등)을 막지 않도록 예외를 던지지 않는다.
   */
  async createAndPush(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    try {
      await this.dispatch(notification.id, input);
    } catch (err) {
      this.logger.error("푸시 발송 중 오류(알림함은 기록됨)", err as Error);
    }

    return notification;
  }

  private async dispatch(
    notificationId: string,
    input: CreateNotificationInput,
  ) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: input.userId, isActive: true },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    // FCM data 값은 모두 문자열이어야 한다.
    const data: Record<string, string> = {
      notificationId,
      type: input.type,
      ...(input.data
        ? Object.fromEntries(
            Object.entries(input.data).map(([k, v]) => [k, String(v)]),
          )
        : {}),
    };

    const results = await Promise.all(
      tokens.map((t) =>
        this.fcm.send({
          token: t.token,
          title: input.title,
          body: input.body,
          data,
        }),
      ),
    );

    const invalid = results.filter((r) => r.invalidToken).map((r) => r.token);
    if (invalid.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: { token: { in: invalid } },
        data: { isActive: false },
      });
      this.logger.log(`무효 토큰 ${invalid.length}개 비활성화`);
    }
  }
}
