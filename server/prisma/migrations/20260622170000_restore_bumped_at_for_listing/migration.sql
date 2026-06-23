-- 최신순 정렬을 다시 전용 bumpedAt 컬럼으로 일원화한다(끌어올리기 전용, 등록 시 createdAt과 동일).
-- 이전 세션의 add/drop 마이그레이션 적용 여부와 무관하게 동작하도록 멱등하게 작성한다.

-- AddColumn (없으면 추가)
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "bumpedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: 기존 행은 등록일(createdAt)을 정렬 기준으로 삼는다.
UPDATE "cars" SET "bumpedAt" = "createdAt";

-- DropIndex (updatedAt 정렬 인덱스 제거)
DROP INDEX IF EXISTS "cars_status_updatedAt_idx";

-- CreateIndex (bumpedAt 정렬 인덱스)
CREATE INDEX IF NOT EXISTS "cars_status_bumpedAt_idx" ON "cars"("status", "bumpedAt");
