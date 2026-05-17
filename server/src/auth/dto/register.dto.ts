import { Equals, IsBoolean, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

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
