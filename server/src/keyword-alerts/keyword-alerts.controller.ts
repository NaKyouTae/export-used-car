import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { KeywordAlertsService } from "./keyword-alerts.service";

@Controller("keyword-alerts")
@UseGuards(JwtAuthGuard)
export class KeywordAlertsController {
  constructor(private readonly service: KeywordAlertsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.service.list(user.id);
  }

  @Post()
  create(@Body() body: { keyword: string }, @CurrentUser() user: any) {
    return this.service.create(user.id, body.keyword);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id);
  }
}
