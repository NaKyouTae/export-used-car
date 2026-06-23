-- DropForeignKey
ALTER TABLE "cars" DROP CONSTRAINT "cars_categoryId_fkey";

-- AlterTable
ALTER TABLE "cars" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
