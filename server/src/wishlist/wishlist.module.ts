import { Module } from "@nestjs/common";
import { WishlistController } from "./wishlist.controller";
import { MyWishlistController } from "./my-wishlist.controller";
import { WishlistService } from "./wishlist.service";

@Module({
  controllers: [WishlistController, MyWishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
