-- AlterTable
ALTER TABLE "DomainEventLog" ADD COLUMN "lockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DomainEventLog_status_lockedAt_idx" ON "DomainEventLog"("status", "lockedAt");
