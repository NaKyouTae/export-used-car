import { IsIn, IsString } from "class-validator";

export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsString()
  @IsIn(["IOS", "ANDROID"])
  platform!: "IOS" | "ANDROID";
}
