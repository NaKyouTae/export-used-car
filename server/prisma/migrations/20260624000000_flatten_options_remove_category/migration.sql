-- 옵션 카테고리 제거: option_items를 평면 리스트로 전환
-- DropForeignKey
ALTER TABLE "option_items" DROP CONSTRAINT IF EXISTS "option_items_categoryId_fkey";

-- AlterTable
ALTER TABLE "option_items" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "option_categories";
