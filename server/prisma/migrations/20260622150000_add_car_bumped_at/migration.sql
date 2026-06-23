-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "bumpedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows so the bump time matches their original listing time
UPDATE "cars" SET "bumpedAt" = "createdAt";

-- CreateIndex
CREATE INDEX "cars_status_bumpedAt_idx" ON "cars"("status", "bumpedAt");
