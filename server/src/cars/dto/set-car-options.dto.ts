import { IsArray, IsString } from "class-validator";

export class SetCarOptionsDto {
  @IsArray()
  @IsString({ each: true })
  optionItemIds: string[];
}
