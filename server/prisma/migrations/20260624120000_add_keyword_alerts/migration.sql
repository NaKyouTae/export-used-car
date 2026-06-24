-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'KEYWORD_MATCH';

-- CreateTable
CREATE TABLE "keyword_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "keyword_alerts_userId_idx" ON "keyword_alerts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_alerts_userId_keyword_key" ON "keyword_alerts"("userId", "keyword");

-- AddForeignKey
ALTER TABLE "keyword_alerts" ADD CONSTRAINT "keyword_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
