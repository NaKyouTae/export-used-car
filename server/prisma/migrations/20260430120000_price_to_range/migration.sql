-- AlterTable: Add priceMin and priceMax columns with default from existing price
ALTER TABLE "cars" ADD COLUMN "priceMin" DECIMAL(12,0) NOT NULL DEFAULT 0;
ALTER TABLE "cars" ADD COLUMN "priceMax" DECIMAL(12,0) NOT NULL DEFAULT 0;

-- Migrate existing price data
UPDATE "cars" SET "priceMin" = "price", "priceMax" = "price";

-- Drop old price column
ALTER TABLE "cars" DROP COLUMN "price";

-- Remove default constraints
ALTER TABLE "cars" ALTER COLUMN "priceMin" DROP DEFAULT;
ALTER TABLE "cars" ALTER COLUMN "priceMax" DROP DEFAULT;

-- Create indexes
CREATE INDEX "cars_priceMin_idx" ON "cars"("priceMin");
CREATE INDEX "cars_priceMax_idx" ON "cars"("priceMax");

-- Drop old price index
DROP INDEX IF EXISTS "cars_price_idx";
