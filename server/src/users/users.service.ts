import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.company !== undefined) data.company = dto.company;
    if (dto.language !== undefined) data.language = dto.language;

    if (user.role === UserRole.SELLER) {
      if (dto.companyName !== undefined) data.companyName = dto.companyName;
      if (dto.contactName !== undefined) data.contactName = dto.contactName;
      if (dto.businessNumber !== undefined)
        data.businessNumber = dto.businessNumber;
      if (dto.address !== undefined) data.address = dto.address;
    }

    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /**
   * 계정 삭제 (회원 탈퇴). Google Play 데이터 삭제 요건 대응.
   * FK 제약이 걸린 테이블을 올바른 순서로 정리한 뒤 유저를 삭제한다.
   * - 채팅방/매물은 seller/buyer FK가 Restrict 라 유저보다 먼저 지운다.
   * - Wishlist/QuickPhrase 는 FK가 없어(범용 참조) 수동으로 지운다.
   * - DeviceToken/Notification/KeywordAlert/Report 는 유저 삭제 시 cascade 된다.
   */
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const cars = await this.prisma.car.findMany({
      where: { sellerId: userId },
      select: { id: true },
    });
    const carIds = cars.map((c) => c.id);

    await this.prisma.$transaction([
      // 1. 내가 판매자/구매자로 속한 채팅방 (메시지 cascade)
      this.prisma.chatRoom.deleteMany({
        where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      }),
      // 2. 위시리스트: 내가 담은 것 + 내 매물을 담은 다른 사람의 것 (FK 없음)
      this.prisma.wishlist.deleteMany({
        where: { OR: [{ userId }, { carId: { in: carIds } }] },
      }),
      // 3. 빠른 문구 (FK 없음)
      this.prisma.quickPhrase.deleteMany({ where: { userId } }),
      // 4. 내 매물 (옵션/태그/이미지/검사 cascade)
      this.prisma.car.deleteMany({ where: { sellerId: userId } }),
      // 5. 유저 (기기토큰/알림/키워드알림/신고 cascade)
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { ok: true };
  }
}
