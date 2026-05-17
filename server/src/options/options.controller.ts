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
import { CreateOptionCategoryDto } from "./dto/create-option-category.dto";
import { CreateOptionItemDto } from "./dto/create-option-item.dto";
import { UpdateOptionCategoryDto } from "./dto/update-option-category.dto";
import { UpdateOptionItemDto } from "./dto/update-option-item.dto";
import { OptionsService } from "./options.service";

@Controller()
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  // ── Option Categories ──

  @Get("option-categories")
  findAllCategories() {
    return this.optionsService.findAllCategories();
  }

  @UseGuards(AdminGuard)
  @Post("option-categories")
  createCategory(@Body() dto: CreateOptionCategoryDto) {
    return this.optionsService.createCategory(dto);
  }

  @UseGuards(AdminGuard)
  @Patch("option-categories/reorder")
  reorderCategories(@Body() dto: ReorderDto) {
    return this.optionsService.reorderCategories(dto.ids);
  }

  @UseGuards(AdminGuard)
  @Patch("option-categories/:id/items/reorder")
  reorderItems(@Param("id") id: string, @Body() dto: ReorderDto) {
    return this.optionsService.reorderItems(id, dto.ids);
  }

  @UseGuards(AdminGuard)
  @Patch("option-categories/:id")
  updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateOptionCategoryDto,
  ) {
    return this.optionsService.updateCategory(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete("option-categories/:id")
  deleteCategory(@Param("id") id: string) {
    return this.optionsService.deleteCategory(id);
  }

  // ── Option Items ──

  @UseGuards(AdminGuard)
  @Post("option-items")
  createItem(@Body() dto: CreateOptionItemDto) {
    return this.optionsService.createItem(dto);
  }

  @UseGuards(AdminGuard)
  @Patch("option-items/:id")
  updateItem(@Param("id") id: string, @Body() dto: UpdateOptionItemDto) {
    return this.optionsService.updateItem(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete("option-items/:id")
  deleteItem(@Param("id") id: string) {
    return this.optionsService.deleteItem(id);
  }
}
