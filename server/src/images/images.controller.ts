import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ImagesService } from "./images.service";
import { UploadImageDto } from "./dto/upload-image.dto";
import { ReorderImagesDto } from "./dto/reorder-images.dto";

@Controller("images")
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
    @CurrentUser() user: any,
  ) {
    return this.imagesService.upload(file, dto, user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.imagesService.remove(id, user.id);
  }

  @Patch("reorder")
  @UseGuards(JwtAuthGuard)
  reorder(@Body() dto: ReorderImagesDto, @CurrentUser() user: any) {
    return this.imagesService.reorder(dto.imageIds, user.id);
  }
}
