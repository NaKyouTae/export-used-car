import { IsEmail, IsEnum } from "class-validator";

export enum SendCodeUserType {
  SELLER = "SELLER",
  BUYER = "BUYER",
}

export class SendCodeDto {
  @IsEmail()
  email: string;

  @IsEnum(SendCodeUserType)
  userType: SendCodeUserType;
}
