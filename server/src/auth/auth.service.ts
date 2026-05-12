import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterBuyerDto } from "./dto/register-buyer.dto";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { EmailService } from "./email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ── send-code ──
  async sendCode(email: string, userType: UserType) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: { email, code, userType, expiresAt },
    });

    console.log(`[AUTH] Verification code for ${email}: ${code}`);

    await this.emailService.sendVerificationCode(email, code);

    return { message: "Verification code sent" };
  }

  // ── verify-code ──
  async verifyCode(email: string, code: string, userType: UserType) {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        userType,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email, userType);

    if (existingUser) {
      const tokens = this.generateTokens(existingUser.id, userType);
      return { ...tokens, isNewUser: false };
    }

    // Sellers cannot self-register — must be added by admin
    if (userType === UserType.SELLER) {
      throw new BadRequestException(
        "You are not a registered seller. Please contact the administrator.",
      );
    }

    // New buyer — return temp token for registration
    const tempToken = this.jwt.sign(
      { email, userType, purpose: "registration" },
      { expiresIn: "10m" as any },
    );

    return { tempToken, isNewUser: true };
  }

  // ── register seller ──
  async registerSeller(tempToken: string, dto: RegisterSellerDto) {
    const payload = this.verifyTempToken(tempToken);

    if (payload.userType !== UserType.SELLER) {
      throw new BadRequestException(
        "Invalid user type for seller registration",
      );
    }

    const existing = await this.prisma.seller.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new BadRequestException("Seller already exists with this email");
    }

    const seller = await this.prisma.seller.create({
      data: {
        email: payload.email,
        companyName: dto.companyName,
        contactName: dto.contactName,
        phone: dto.phone,
        businessNumber: dto.businessNumber,
        address: dto.address,
      },
    });

    return this.generateTokens(seller.id, UserType.SELLER);
  }

  // ── register buyer ──
  async registerBuyer(tempToken: string, dto: RegisterBuyerDto) {
    const payload = this.verifyTempToken(tempToken);

    if (payload.userType !== UserType.BUYER) {
      throw new BadRequestException("Invalid user type for buyer registration");
    }

    const existing = await this.prisma.buyer.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new BadRequestException("Buyer already exists with this email");
    }

    const buyer = await this.prisma.buyer.create({
      data: {
        email: payload.email,
        name: dto.name,
        country: dto.country,
        company: dto.company,
        phone: dto.phone,
      },
    });

    return this.generateTokens(buyer.id, UserType.BUYER);
  }

  // ── refresh ──
  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.findUserById(payload.sub, payload.userType);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.generateTokens(payload.sub, payload.userType);
  }

  // ── profile ──
  getProfile(user: any) {
    const { userType, ...profile } = user;
    return { userType, ...profile };
  }

  // ── helpers ──
  private async findUserByEmail(email: string, userType: UserType) {
    if (userType === UserType.SELLER) {
      return this.prisma.seller.findUnique({ where: { email } });
    }
    if (userType === UserType.BUYER) {
      return this.prisma.buyer.findUnique({ where: { email } });
    }
    return null;
  }

  private async findUserById(id: string, userType: string) {
    if (userType === "SELLER") {
      return this.prisma.seller.findUnique({ where: { id } });
    }
    if (userType === "BUYER") {
      return this.prisma.buyer.findUnique({ where: { id } });
    }
    return null;
  }

  private generateTokens(userId: string, userType: UserType) {
    const accessToken = this.jwt.sign(
      { sub: userId, userType, type: "access" },
      {
        expiresIn: (this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ||
          "1h") as any,
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, userType, type: "refresh" },
      {
        expiresIn: (this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ||
          "7d") as any,
      },
    );

    return { accessToken, refreshToken };
  }

  private verifyTempToken(token: string): {
    email: string;
    userType: UserType;
    purpose: string;
  } {
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired registration token");
    }

    if (payload.purpose !== "registration") {
      throw new UnauthorizedException("Invalid token purpose");
    }

    return payload;
  }
}
