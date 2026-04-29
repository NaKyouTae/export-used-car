import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  userType: "SELLER" | "BUYER";
  type: "access" | "refresh";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    let user: any;

    if (payload.userType === "SELLER") {
      user = await this.prisma.seller.findUnique({
        where: { id: payload.sub },
      });
    } else if (payload.userType === "BUYER") {
      user = await this.prisma.buyer.findUnique({
        where: { id: payload.sub },
      });
    }

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return { ...user, userType: payload.userType };
  }
}
