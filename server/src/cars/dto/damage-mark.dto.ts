import { IsIn, IsNumber, IsString, Max, Min } from "class-validator";

export const DAMAGE_MARK_TYPES = ["REPLACE", "REPAIR"] as const;
export type DamageMarkType = (typeof DAMAGE_MARK_TYPES)[number];

/** 차량 부위 도면 위 마커 1개 (좌표는 이미지 컨테이너 대비 0~100%) */
export class DamageMarkDto {
  @IsString()
  id: string;

  @IsIn(DAMAGE_MARK_TYPES)
  type: DamageMarkType;

  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;
}
