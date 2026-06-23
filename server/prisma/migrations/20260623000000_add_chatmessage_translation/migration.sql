-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "sourceLang" TEXT,
ADD COLUMN     "translatedContent" TEXT,
ADD COLUMN     "translatedLang" TEXT;
