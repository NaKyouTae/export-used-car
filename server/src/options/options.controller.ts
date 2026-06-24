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
import { CreateOptionItemDto } from "./dto/create-option-item.dto";
import { UpdateOptionItemDto } from "./dto/update-option-item.dto";
import { OptionsService } from "./options.service";

@Controller("options")
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  findAll() {
    return this.optionsService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateOptionItemDto) {
    return this.optionsService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Patch("reorder")
  reorder(@Body() dto: ReorderDto) {
    return this.optionsService.reorder(dto.ids);
  }

  @UseGuards(AdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOptionItemDto) {
    return this.optionsService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.optionsService.delete(id);
  }
}
