-- 끌어올리기/최신순 정렬을 bumpedAt 전용 컬럼 대신 updatedAt으로 일원화한다.

-- DropIndex (이전 bumpedAt 인덱스 제거)
DROP INDEX IF EXISTS "cars_status_bumpedAt_idx";

-- DropColumn (bumpedAt 컬럼 제거)
ALTER TABLE "cars" DROP COLUMN IF EXISTS "bumpedAt";

-- CreateIndex (updatedAt 정렬용 인덱스)
CREATE INDEX IF NOT EXISTS "cars_status_updatedAt_idx" ON "cars"("status", "updatedAt");
