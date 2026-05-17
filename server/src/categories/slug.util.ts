import { BadRequestException } from "@nestjs/common";

const SLUG_MAP: Record<string, string> = {
  세단: "sedan",
  SUV: "suv",
  RV: "rv",
  해치백: "hatchback",
  쿠페: "coupe",
  컨버터블: "convertible",
  왜건: "wagon",
  미니밴: "minivan",
  승합차: "minivan",
  트럭: "truck",
  픽업: "pickup",
  픽업트럭: "pickup",
  버스: "bus",
  밴: "van",
  화물밴: "van",
  특장차: "special",
  특수차: "special",
  덤프트럭: "dump",
  믹서트럭: "mixer",
  크레인: "crane",
};

export function generateSlug(name: string): string {
  const trimmed = name.trim();

  const mapped = SLUG_MAP[trimmed];
  if (mapped) return mapped;

  const asciiSlug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (asciiSlug) return asciiSlug;

  throw new BadRequestException(
    `등록되지 않은 카테고리 이름입니다: "${trimmed}". 미리 정의된 한글 이름(세단, SUV, 트럭 등)을 사용하거나 영문 이름으로 입력해주세요.`,
  );
}
