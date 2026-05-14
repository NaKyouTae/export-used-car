import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { SellersService } from "./sellers.service";
import { CarsService } from "../cars/cars.service";
import { UpdateSellerDto } from "./dto/update-seller.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@Controller("sellers")
@UseGuards(JwtAuthGuard)
export class SellersController {
  constructor(
    private readonly sellersService: SellersService,
    private readonly carsService: CarsService,
  ) {}

  @Get("me")
  getMe(@CurrentUser() user: any) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can access this endpoint");
    }
    return this.sellersService.findMe(user.id);
  }

  @Patch("me")
  updateMe(@Body() dto: UpdateSellerDto, @CurrentUser() user: any) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can access this endpoint");
    }
    return this.sellersService.updateMe(user.id, dto);
  }

  @Get("me/cars")
  getMyCars(@Query() query: PaginationDto, @CurrentUser() user: any) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can access this endpoint");
    }
    return this.carsService.findBySeller(user.id, query.cursor, query.limit);
  }
}
