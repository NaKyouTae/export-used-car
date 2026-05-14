import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CarsService } from "./cars.service";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { CarQueryDto } from "./dto/car-query.dto";
import { SetCarOptionsDto } from "./dto/set-car-options.dto";
import { SetCarTagsDto } from "./dto/set-car-tags.dto";

@Controller("cars")
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  findAll(@Query() query: CarQueryDto) {
    return this.carsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.carsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCarDto, @CurrentUser() user: any) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can create cars");
    }
    return this.carsService.create(dto, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCarDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can update cars");
    }
    return this.carsService.update(id, dto, user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can delete cars");
    }
    return this.carsService.remove(id, user.id);
  }

  @Put(":id/options")
  @UseGuards(JwtAuthGuard)
  setOptions(
    @Param("id") id: string,
    @Body() dto: SetCarOptionsDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can manage car options");
    }
    return this.carsService.setOptions(id, dto.optionItemIds, user.id);
  }

  @Put(":id/tags")
  @UseGuards(JwtAuthGuard)
  setTags(
    @Param("id") id: string,
    @Body() dto: SetCarTagsDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== "SELLER") {
      throw new ForbiddenException("Only sellers can manage car tags");
    }
    return this.carsService.setTags(id, dto.tagIds, user.id);
  }
}
