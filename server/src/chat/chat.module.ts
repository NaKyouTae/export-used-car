import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { TranslationModule } from "../translation/translation.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [TranslationModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
