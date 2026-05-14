import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: any) {
    return this.usersService.findMe(user.id);
  }

  @Patch("me")
  updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.updateMe(user.id, dto);
  }
}
