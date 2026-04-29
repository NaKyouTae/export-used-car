import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { SendCodeUserType } from "./send-code.dto";

export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsEnum(SendCodeUserType)
  userType: SendCodeUserType;
}
