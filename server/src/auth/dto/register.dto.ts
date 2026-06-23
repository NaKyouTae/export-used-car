import { Equals, IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  // 기본 언어 (미지정 시 서버에서 EN 처리)
  @IsString()
  @IsIn(["EN", "KO"])
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @Equals(true, { message: "You must accept the Terms of Service" })
  agreedToTerms!: boolean;

  @IsBoolean()
  @Equals(true, { message: "You must accept the Privacy Policy" })
  agreedToPrivacy!: boolean;
}
