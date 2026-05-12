import { Controller, Get, UseGuards } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("wishlist")
export class MyWishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getMyWishlist(user.id, user.userType);
  }
}
