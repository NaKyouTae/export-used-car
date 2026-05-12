-- DropForeignKey
ALTER TABLE "wishlists" DROP CONSTRAINT IF EXISTS "wishlists_buyerId_fkey";
ALTER TABLE "wishlists" DROP CONSTRAINT IF EXISTS "wishlists_carId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "wishlists_buyerId_carId_key";

-- Rename buyerId to userId
ALTER TABLE "wishlists" RENAME COLUMN "buyerId" TO "userId";

-- Add userType column
ALTER TABLE "wishlists" ADD COLUMN "userType" TEXT NOT NULL DEFAULT 'BUYER';

-- Remove default after backfill
ALTER TABLE "wishlists" ALTER COLUMN "userType" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_userType_carId_key" ON "wishlists"("userId", "userType", "carId");
