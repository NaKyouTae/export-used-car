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
import { AdminGuard } from "../common/guards/admin.guard";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.tagsService.delete(id);
  }
}
