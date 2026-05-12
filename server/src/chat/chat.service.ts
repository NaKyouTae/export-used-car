import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGetRoom(carId: string, buyerId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, sellerId: true },
    });
    if (!car) throw new NotFoundException("Car not found");

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

  async getRooms(userId: string, userType: string, carId?: string) {
    const where: any =
      userType === "BUYER" ? { buyerId: userId } : { sellerId: userId };
    if (carId) where.carId = carId;

    const rooms = await this.prisma.chatRoom.findMany({
      where,
      orderBy: [
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
      lastMessage: room.messages[0] || null,
      unreadCount:
        userType === "BUYER" ? room.buyerUnreadCount : room.sellerUnreadCount,
      createdAt: room.createdAt,
    }));
  }

  async getTotalUnreadCount(userId: string, userType: string) {
    const where =
      userType === "BUYER" ? { buyerId: userId } : { sellerId: userId };
    const field =
      userType === "BUYER" ? "buyerUnreadCount" : "sellerUnreadCount";

    const result = await this.prisma.chatRoom.aggregate({
      where,
      _sum: { [field]: true } as any,
    });

    return { unreadCount: (result._sum as any)?.[field] ?? 0 };
  }

  async getRoom(roomId: string, userId: string, _userType: string) {
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
    userType: string,
    options?: { cursor?: string; limit?: number },
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Mark messages as read
    const unreadField =
      userType === "BUYER" ? "buyerUnreadCount" : "sellerUnreadCount";
    const oppositeType = userType === "BUYER" ? "SELLER" : "BUYER";

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
    userType: string,
    content: string,
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException("Chat room not found");
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const senderType = userType === "BUYER" ? "BUYER" : "SELLER";
    const unreadField =
      userType === "BUYER" ? "sellerUnreadCount" : "buyerUnreadCount";

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
}
