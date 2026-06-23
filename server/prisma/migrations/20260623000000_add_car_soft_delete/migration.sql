-- AlterEnum
ALTER TYPE "CarStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "cars" ADD COLUMN "deletedAt" TIMESTAMP(3);
