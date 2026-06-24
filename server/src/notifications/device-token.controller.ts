import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { RegisterDeviceTokenDto } from "./dto/register-device-token.dto";

@Controller("device-tokens")
export class DeviceTokenController {
  constructor(private readonly notifications: NotificationsService) {}

  /** 앱 시작/로그인 시 Capacitor가 받은 FCM 토큰을 등록(upsert)한다. */
  @UseGuards(JwtAuthGuard)
  @Post()
  register(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() user: any) {
    return this.notifications.registerToken(user.id, dto.token, dto.platform);
  }

  /** 로그아웃 시 토큰 비활성화. */
  @UseGuards(JwtAuthGuard)
  @Delete(":token")
  remove(@Param("token") token: string) {
    return this.notifications.removeToken(token);
  }
}
