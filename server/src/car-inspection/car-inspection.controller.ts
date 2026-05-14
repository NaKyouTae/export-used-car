import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CarInspectionService } from "./car-inspection.service";
import { UpsertInspectionDto } from "./dto/upsert-inspection.dto";

@Controller("cars/:carId/inspection")
export class CarInspectionController {
  constructor(private readonly carInspectionService: CarInspectionService) {}

  @Get()
  findByCarId(@Param("carId") carId: string) {
    return this.carInspectionService.findByCarId(carId);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  upsert(
    @Param("carId") carId: string,
    @Body() dto: UpsertInspectionDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can manage inspections");
    }
    return this.carInspectionService.upsert(carId, dto, user.id);
  }
}
