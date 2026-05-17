import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
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
  async sendCode(email: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    console.log(`[AUTH] Verification code for ${email}: ${code}`);

    await this.emailService.sendVerificationCode(email, code);

    return { message: "Verification code sent" };
  }

  // ── verify-code ──
  async verifyCode(email: string, code: string) {
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email,
        code,
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const tokens = this.generateTokens(existingUser.id, existingUser.role);
      return { ...tokens, isNewUser: false };
    }

    // 신규 사용자 → 가입용 임시 토큰
    const tempToken = this.jwt.sign(
      { email, purpose: "registration" },
      { expiresIn: "10m" as any },
    );

    return { tempToken, isNewUser: true };
  }

  // ── register ──
  async register(tempToken: string, dto: RegisterDto) {
    const payload = this.verifyTempToken(tempToken);

    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new BadRequestException("User already exists with this email");
    }

    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        name: dto.name,
        country: dto.country,
        company: dto.company,
        phone: dto.phone,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
    });

    return this.generateTokens(user.id, user.role);
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

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.generateTokens(user.id, user.role);
  }

  // ── profile ──
  getProfile(user: any) {
    return user;
  }

  // ── helpers ──
  private generateTokens(userId: string, role: UserRole) {
    const accessToken = this.jwt.sign(
      { sub: userId, role, type: "access" },
      {
        expiresIn: (this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ||
          "1h") as any,
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, role, type: "refresh" },
      {
        expiresIn: (this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ||
          "7d") as any,
      },
    );

    return { accessToken, refreshToken };
  }

  private verifyTempToken(token: string): {
    email: string;
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
