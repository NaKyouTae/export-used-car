import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ImageCategory } from "@prisma/client";

export class UploadImageDto {
  @IsEnum(ImageCategory)
  imageCategory: ImageCategory;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
