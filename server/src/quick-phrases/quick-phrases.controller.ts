import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { QuickPhrasesService } from "./quick-phrases.service";

@Controller("quick-phrases")
@UseGuards(JwtAuthGuard)
export class QuickPhrasesController {
  constructor(private readonly service: QuickPhrasesService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.service.list(user.id);
  }

  @Post()
  create(
    @Body() body: { content: string; category?: string; displayOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.service.create(user.id, body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: { content?: string; category?: string; displayOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, user.id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id);
  }
}
