import { Controller, Param, Post, Get, UseGuards } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("cars/:carId/wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  toggle(@Param("carId") carId: string, @CurrentUser() user: any) {
    return this.wishlistService.toggle(user.id, carId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  check(@Param("carId") carId: string, @CurrentUser() user: any) {
    return this.wishlistService.isWishlisted(user.id, carId);
  }
}
