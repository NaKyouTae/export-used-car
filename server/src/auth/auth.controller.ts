import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterBuyerDto } from "./dto/register-buyer.dto";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { SendCodeDto } from "./dto/send-code.dto";
import { VerifyCodeDto } from "./dto/verify-code.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-code")
  sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto.email, dto.userType);
  }

  @Post("verify-code")
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.email, dto.code, dto.userType);
  }

  @Post("seller/register")
  registerSeller(
    @Headers("authorization") authorization: string,
    @Body() dto: RegisterSellerDto,
  ) {
    const token = this.extractBearerToken(authorization);
    return this.authService.registerSeller(token, dto);
  }

  @Post("buyer/register")
  registerBuyer(
    @Headers("authorization") authorization: string,
    @Body() dto: RegisterBuyerDto,
  ) {
    const token = this.extractBearerToken(authorization);
    return this.authService.registerBuyer(token, dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user);
  }

  private extractBearerToken(authorization: string): string {
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }
    return authorization.slice(7);
  }
}
