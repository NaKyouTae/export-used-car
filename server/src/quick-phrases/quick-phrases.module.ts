import { Module } from "@nestjs/common";
import { QuickPhrasesController } from "./quick-phrases.controller";
import { QuickPhrasesService } from "./quick-phrases.service";

@Module({
  controllers: [QuickPhrasesController],
  providers: [QuickPhrasesService],
})
export class QuickPhrasesModule {}
