import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationDto } from "../common/dto/pagination.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** 내 알림함 (커서 페이지네이션) */
  @Get()
  list(@Query() query: PaginationDto, @CurrentUser() user: any) {
    return this.notifications.list(user.id, query.limit, query.cursor);
  }

  /** 안 읽은 알림 개수 (배지 카운트) */
  @Get("unread-count")
  unreadCount(@CurrentUser() user: any) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: any) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }
}
