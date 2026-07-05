import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { SellerStatus, UserRole } from "@prisma/client";
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
    // Google Play 검토용 테스트 계정: 실제 코드 발송 없이 통과 (고정 코드 사용)
    if (this.isReviewEmail(email)) {
      console.log(
        `[AUTH] Review test account requested code: ${email} (send skipped)`,
      );
      return { message: "Verification code sent" };
    }

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
    // Google Play 검토용 우회: 지정 이메일 + 고정 코드면 리뷰 계정으로 로그인
    if (this.isReviewEmail(email) && code === this.reviewCode()) {
      const reviewUser = await this.getOrCreateReviewUser(email);
      const tokens = this.generateTokens(reviewUser.id, reviewUser.role);
      return { ...tokens, isNewUser: false };
    }

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
        language: dto.language ?? "EN",
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

  // Google Play 검토용 테스트 계정 (env로만 활성화, 미설정 시 비활성)
  private reviewEmail(): string | undefined {
    return (
      this.config.get<string>("REVIEW_TEST_EMAIL")?.trim().toLowerCase() ||
      undefined
    );
  }

  private reviewCode(): string {
    return this.config.get<string>("REVIEW_TEST_CODE") || "000000";
  }

  private isReviewEmail(email: string): boolean {
    const review = this.reviewEmail();
    return !!review && email.trim().toLowerCase() === review;
  }

  private async getOrCreateReviewUser(email: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) return existing;

    const now = new Date();
    // 바이어 + 셀러 기능 모두 검토 가능하도록 ACTIVE 셀러로 생성
    return this.prisma.user.create({
      data: {
        email: normalized,
        name: "Google Review",
        country: "KR",
        company: "Ajucar",
        language: "EN",
        role: UserRole.SELLER,
        sellerStatus: SellerStatus.ACTIVE,
        companyName: "Ajucar Review",
        contactName: "Google Review",
        isVerified: true,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
    });
  }

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
