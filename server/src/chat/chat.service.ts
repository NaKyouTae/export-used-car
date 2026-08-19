import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { TranslationService } from "../translation/translation.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MAX_IMAGE_UPLOAD_BYTES } from "../common/upload/image-upload.options";

// 채팅 이미지 메시지는 content 앞에 이 prefix를 붙여 저장한다.
const IMAGE_MESSAGE_PREFIX = "[img]";

// 사용자 언어(EN/KO 등) → Google Translate ISO 코드. 매핑에 없으면 소문자로 폴백.
const GOOGLE_LANG_CODE: Record<string, string> = {
  EN: "en",
  KO: "ko",
};
const toGoogleLangCode = (lang?: string | null): string => {
  if (!lang) return "en";
  return GOOGLE_LANG_CODE[lang.toUpperCase()] ?? lang.toLowerCase();
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly translation: TranslationService,
    private readonly notifications: NotificationsService,
  ) {}

  async createOrGetRoom(carId: string, buyerId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, sellerId: true },
    });
    if (!car) throw new NotFoundException("Car not found");

    // 본인 차량에는 채팅을 걸 수 없음
    if (car.sellerId === buyerId) {
      throw new BadRequestException("Cannot start a chat on your own vehicle");
    }

    const existing = await this.prisma.chatRoom.findUnique({
      where: {
        carId_sellerId_buyerId: {
          carId,
          sellerId: car.sellerId,
          buyerId,
        },
      },
    });

    if (existing) return existing;

    const room = await this.prisma.chatRoom.create({
      data: {
        carId,
        sellerId: car.sellerId,
        buyerId,
      },
    });

    // Increment car chatCount
    await this.prisma.car.update({
      where: { id: carId },
      data: { chatCount: { increment: 1 } },
    });

    return room;
  }

  async setDesiredPrice(roomId: string, userId: string, desiredPrice: number) {
    if (
      desiredPrice === null ||
      desiredPrice === undefined ||
      Number.isNaN(desiredPrice) ||
      desiredPrice <= 0
    ) {
      throw new BadRequestException("Invalid desired price");
    }

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { id: true, buyerId: true },
    });
    if (!room) throw new NotFoundException("Chat room not found");

    // 구매 희망 가격은 구매자만 입력할 수 있음
    if (room.buyerId !== userId) {
      throw new ForbiddenException("Only the buyer can set the desired price");
    }

    return this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { desiredPrice },
      select: { id: true, desiredPrice: true },
    });
  }

  async getRooms(userId: string, _role: string, carId?: string) {
    // 방 안에서의 입장은 역할이 아니라 sellerId/buyerId로 판단
    const where: any = {
      OR: [{ sellerId: userId }, { buyerId: userId }],
    };
    if (carId) where.carId = carId;

    const rooms = await this.prisma.chatRoom.findMany({
      where,
      // 차량 기준 구매 희망 가격이 높은 순으로 정렬 (가격 미입력 방은 뒤로)
      orderBy: [
        { desiredPrice: { sort: "desc", nulls: "last" } },
        { lastMessageAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        car: {
          select: {
            id: true,
            title: true,
            priceMin: true,
            priceMax: true,
          },
        },
        seller: { select: { id: true, companyName: true, contactName: true } },
        buyer: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderType: true },
        },
      },
    });

    return rooms.map((room) => ({
      id: room.id,
      car: room.car,
      seller: room.seller,
      buyer: room.buyer,
      desiredPrice: room.desiredPrice,
      lastMessage: room.messages[0] || null,
      unreadCount:
        room.sellerId === userId
          ? room.sellerUnreadCount
          : room.buyerUnreadCount,
      createdAt: room.createdAt,
    }));
  }

  async getTotalUnreadCount(userId: string, _role: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      select: {
        sellerId: true,
        sellerUnreadCount: true,
        buyerUnreadCount: true,
      },
    });

    const unreadCount = rooms.reduce(
      (sum, r) =>
        sum +
        (r.sellerId === userId ? r.sellerUnreadCount : r.buyerUnreadCount),
      0,
    );

    return { unreadCount };
  }

  async getRoom(roomId: string, userId: string, _role: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        car: {
          select: { id: true, title: true, priceMin: true, priceMax: true },
        },
        seller: { select: { id: true, companyName: true, contactName: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return room;
  }

  async getMessages(
    roomId: string,
    userId: string,
    _role: string,
    options?: { cursor?: string; limit?: number },
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // 방 안에서의 입장(셀러/구매자)을 sellerId 기준으로 판단
    const isSellerSide = room.sellerId === userId;
    // 내 안 읽음 카운트 리셋 + 상대가 보낸 메시지를 읽음 처리
    const unreadField = isSellerSide ? "sellerUnreadCount" : "buyerUnreadCount";
    const oppositeType = isSellerSide ? "BUYER" : "SELLER";

    await this.prisma.$transaction([
      this.prisma.chatMessage.updateMany({
        where: { roomId, senderType: oppositeType, isRead: false },
        data: { isRead: true },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { [unreadField]: 0 },
      }),
    ]);

    const limit = options?.limit || 10;
    const where: any = { roomId };

    // cursor = oldest message id we already have → fetch older ones
    if (options?.cursor) {
      where.createdAt = {
        lt: (
          await this.prisma.chatMessage.findUnique({
            where: { id: options.cursor },
            select: { createdAt: true },
          })
        )?.createdAt,
      };
    }

    // Fetch limit+1 in desc order (newest-first) to check hasMore
    const rows = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    // Return in chronological order (oldest first)
    return {
      data: data.reverse(),
      hasMore,
    };
  }

  async sendMessage(
    roomId: string,
    userId: string,
    _role: string,
    content: string,
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // 방 안에서의 입장을 sellerId 기준으로 판단, 상대 쪽 안 읽음 카운트 증가
    const isSellerSide = room.sellerId === userId;
    const senderType = isSellerSide ? "SELLER" : "BUYER";
    const unreadField = isSellerSide ? "buyerUnreadCount" : "sellerUnreadCount";

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          roomId,
          senderType,
          senderId: userId,
          content,
        },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          lastMessageAt: new Date(),
          [unreadField]: { increment: 1 },
        },
      }),
    ]);

    this.notifyRecipient(room, isSellerSide, content);

    return message;
  }

  /**
   * 특정 메시지를 "번역을 요청한 사용자의 언어"로 번역한다.
   * - 자동번역 아님: 클라이언트에서 번역 버튼을 누를 때만 호출된다.
   * - 원문 언어 == 사용자 언어면 번역하지 않고 sameLanguage=true로 응답.
   * - 한 번 번역하면 DB에 캐시되어 재요청 시 API를 다시 호출하지 않는다.
   */
  async translateMessage(roomId: string, messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message || message.roomId !== roomId) {
      throw new NotFoundException("Message not found");
    }

    // 방 참여자만 번역 가능
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // 이미지 메시지는 번역 대상이 아니다.
    if (message.content.startsWith(IMAGE_MESSAGE_PREFIX)) {
      throw new BadRequestException("Image messages cannot be translated");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    const target = toGoogleLangCode(user?.language);

    // 이미 같은 언어로 번역해둔 캐시가 있으면 그대로 반환
    if (message.translatedContent && message.translatedLang === target) {
      return {
        sourceLang: message.sourceLang,
        translatedContent: message.translatedContent,
        translatedLang: message.translatedLang,
        sameLanguage: message.sourceLang === target,
      };
    }

    const { translatedText, detectedSourceLanguage } =
      await this.translation.translate(message.content, target);

    // 원문 언어가 내 언어와 같으면 번역 불필요
    const sameLanguage = detectedSourceLanguage === target;

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        sourceLang: detectedSourceLanguage,
        translatedContent: translatedText,
        translatedLang: target,
      },
      select: {
        sourceLang: true,
        translatedContent: true,
        translatedLang: true,
      },
    });

    return { ...updated, sameLanguage };
  }

  async uploadImage(roomId: string, userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image files are allowed");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException("Image is too large (max 10MB)");
    }

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const url = await this.storage.upload(file, `CHAT/${roomId}`);

    // 이미지는 prefix를 붙여 일반 채팅 메시지로 저장한다.
    const isSellerSide = room.sellerId === userId;
    const senderType = isSellerSide ? "SELLER" : "BUYER";
    const unreadField = isSellerSide ? "buyerUnreadCount" : "sellerUnreadCount";

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          roomId,
          senderType,
          senderId: userId,
          content: `${IMAGE_MESSAGE_PREFIX}${url}`,
        },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: {
          lastMessageAt: new Date(),
          [unreadField]: { increment: 1 },
        },
      }),
    ]);

    this.notifyRecipient(room, isSellerSide, `${IMAGE_MESSAGE_PREFIX}image`);

    return message;
  }

  /**
   * 채팅 상대방에게 인앱 알림 기록 + 푸시 발송.
   * 실패해도 메시지 전송 흐름을 막지 않도록 await하지 않는다(fire-and-forget).
   * 민감 내용 노출 방지를 위해 본문은 미리보기만 전송한다.
   */
  private notifyRecipient(
    room: {
      id: string;
      buyerId: string;
      sellerId: string;
      carId: string | null;
    },
    isSellerSide: boolean,
    content: string,
  ) {
    const recipientId = isSellerSide ? room.buyerId : room.sellerId;
    const isImage = content.startsWith(IMAGE_MESSAGE_PREFIX);
    const preview = isImage
      ? "사진을 보냈습니다"
      : content.length > 50
        ? `${content.slice(0, 50)}…`
        : content;
    void this.notifications.createAndPush({
      userId: recipientId,
      type: "CHAT_MESSAGE",
      title: "새 메시지",
      body: preview,
      data: {
        chatRoomId: room.id,
        ...(room.carId ? { carId: room.carId } : {}),
      },
    });
  }
}
