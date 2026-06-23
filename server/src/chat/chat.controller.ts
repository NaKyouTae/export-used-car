import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("rooms")
  createRoom(@Body() body: { carId: string }, @CurrentUser() user: any) {
    // 본인 차량 여부는 서비스에서 검증 (소유자가 아니면 누구나 채팅 가능)
    return this.chatService.createOrGetRoom(body.carId, user.id);
  }

  @Get("unread-count")
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getTotalUnreadCount(user.id, user.role);
  }

  @Get("rooms")
  getRooms(@CurrentUser() user: any, @Query("carId") carId?: string) {
    return this.chatService.getRooms(user.id, user.role, carId);
  }

  @Get("rooms/:roomId")
  getRoom(@Param("roomId") roomId: string, @CurrentUser() user: any) {
    return this.chatService.getRoom(roomId, user.id, user.role);
  }

  @Patch("rooms/:roomId/desired-price")
  setDesiredPrice(
    @Param("roomId") roomId: string,
    @Body() body: { desiredPrice: number },
    @CurrentUser() user: any,
  ) {
    return this.chatService.setDesiredPrice(
      roomId,
      user.id,
      Number(body.desiredPrice),
    );
  }

  @Get("rooms/:roomId/messages")
  getMessages(
    @Param("roomId") roomId: string,
    @CurrentUser() user: any,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.chatService.getMessages(roomId, user.id, user.role, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post("rooms/:roomId/images")
  @UseInterceptors(FileInterceptor("file"))
  uploadImage(
    @Param("roomId") roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.chatService.uploadImage(roomId, user.id, file);
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
      user.role,
      body.content,
    );
  }

  @Post("rooms/:roomId/messages/:messageId/translate")
  translateMessage(
    @Param("roomId") roomId: string,
    @Param("messageId") messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.translateMessage(roomId, messageId, user.id);
  }
}
