import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("rooms")
  createRoom(@Body() body: { carId: string }, @CurrentUser() user: any) {
    if (user.userType !== "BUYER") {
      return { error: "Only buyers can initiate chat" };
    }
    return this.chatService.createOrGetRoom(body.carId, user.id);
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getTotalUnreadCount(user.id, user.userType);
  }

  @Get("rooms")
  getRooms(@CurrentUser() user: any, @Query("carId") carId?: string) {
    return this.chatService.getRooms(user.id, user.userType, carId);
  }

  @Get("rooms/:roomId")
  getRoom(@Param("roomId") roomId: string, @CurrentUser() user: any) {
    return this.chatService.getRoom(roomId, user.id, user.userType);
  }

  @Get("rooms/:roomId/messages")
  getMessages(
    @Param("roomId") roomId: string,
    @CurrentUser() user: any,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getMessages(roomId, user.id, user.userType, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post("rooms/:roomId/messages")
  sendMessage(
    @Param("roomId") roomId: string,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage(
      roomId,
      user.id,
      user.userType,
      body.content,
    );
  }
}
