import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { TranslationModule } from "../translation/translation.module";

@Module({
  imports: [TranslationModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
