import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";

// 채팅 이미지 메시지는 content 앞에 이 prefix를 붙여 저장한다.
const IMAGE_MESSAGE_PREFIX = "[img]";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
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

    return message;
  }

  async uploadImage(roomId: string, userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Only image files are allowed");
    }
    if (file.size > MAX_IMAGE_SIZE) {
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

    return message;
  }
}
