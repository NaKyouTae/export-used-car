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
import { ReorderDto } from "../common/dto/reorder.dto";
import { AdminGuard } from "../common/guards/admin.guard";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { CreateMakeDto } from "./dto/create-make.dto";
import { UpdateCarModelDto } from "./dto/update-car-model.dto";
import { UpdateMakeDto } from "./dto/update-make.dto";
import { MakesService } from "./makes.service";

@Controller()
export class MakesController {
  constructor(private readonly makesService: MakesService) {}

  @Get("makes")
  findAll() {
    return this.makesService.findAll();
  }

  @Get("makes/:id/models")
  findModels(@Param("id") id: string) {
    return this.makesService.findModels(id);
  }

  @Post("makes")
  @UseGuards(AdminGuard)
  createMake(@Body() dto: CreateMakeDto) {
    return this.makesService.createMake(dto);
  }

  @Patch("makes/reorder")
  @UseGuards(AdminGuard)
  reorderMakes(@Body() dto: ReorderDto) {
    return this.makesService.reorderMakes(dto.ids);
  }

  @Patch("makes/:id")
  @UseGuards(AdminGuard)
  updateMake(@Param("id") id: string, @Body() dto: UpdateMakeDto) {
    return this.makesService.updateMake(id, dto);
  }

  @Delete("makes/:id")
  @UseGuards(AdminGuard)
  removeMake(@Param("id") id: string) {
    return this.makesService.removeMake(id);
  }

  @Post("makes/:id/models")
  @UseGuards(AdminGuard)
  createModel(@Param("id") id: string, @Body() dto: CreateCarModelDto) {
    return this.makesService.createModel(id, dto);
  }

  @Patch("makes/:id/models/reorder")
  @UseGuards(AdminGuard)
  reorderModels(@Param("id") id: string, @Body() dto: ReorderDto) {
    return this.makesService.reorderModels(id, dto.ids);
  }

  @Patch("car-models/:id")
  @UseGuards(AdminGuard)
  updateModel(@Param("id") id: string, @Body() dto: UpdateCarModelDto) {
    return this.makesService.updateModel(id, dto);
  }

  @Delete("car-models/:id")
  @UseGuards(AdminGuard)
  removeModel(@Param("id") id: string) {
    return this.makesService.removeModel(id);
  }
}
