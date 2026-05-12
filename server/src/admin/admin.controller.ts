import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { AdminService } from "./admin.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { UpdateSellerStatusDto } from "./dto/update-seller-status.dto";
import { UpdateCarStatusDto } from "./dto/update-car-status.dto";
import { AdminSellersQueryDto } from "./dto/admin-sellers-query.dto";
import { AdminCarsQueryDto } from "./dto/admin-cars-query.dto";
import { CreateSellerDto } from "./dto/create-seller.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.token);
  }

  @Get("dashboard")
  @UseGuards(AdminGuard)
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("sellers")
  @UseGuards(AdminGuard)
  findSellers(@Query() query: AdminSellersQueryDto) {
    return this.adminService.findSellers(query);
  }

  @Post("sellers")
  @UseGuards(AdminGuard)
  createSeller(@Body() dto: CreateSellerDto) {
    return this.adminService.createSeller(dto);
  }

  @Patch("sellers/:id/status")
  @UseGuards(AdminGuard)
  updateSellerStatus(
    @Param("id") id: string,
    @Body() dto: UpdateSellerStatusDto,
  ) {
    return this.adminService.updateSellerStatus(id, dto.status);
  }

  @Get("cars")
  @UseGuards(AdminGuard)
  findCars(@Query() query: AdminCarsQueryDto) {
    return this.adminService.findCars(query);
  }

  @Patch("cars/:id/status")
  @UseGuards(AdminGuard)
  updateCarStatus(@Param("id") id: string, @Body() dto: UpdateCarStatusDto) {
    return this.adminService.updateCarStatus(id, dto.status);
  }
}
