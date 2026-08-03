-- CreateEnum
CREATE TYPE "DropSource" AS ENUM ('LEAD_CLAIM');

-- CreateEnum
CREATE TYPE "DropRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateTable
CREATE TABLE "Drop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "source" "DropSource" NOT NULL,
    "rarity" "DropRarity" NOT NULL DEFAULT 'COMMON',
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drop_userId_createdAt_idx" ON "Drop"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Drop_leadId_idx" ON "Drop"("leadId");

-- AddForeignKey
ALTER TABLE "Drop" ADD CONSTRAINT "Drop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drop" ADD CONSTRAINT "Drop_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
