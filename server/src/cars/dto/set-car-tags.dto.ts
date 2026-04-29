import { IsArray, IsString } from "class-validator";

export class SetCarTagsDto {
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}
