-- CreateTable
CREATE TABLE "DomainEventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "actorId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastErrorCode" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEventConsumerReceipt" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "consumerKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEventConsumerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainEventLog_eventId_key" ON "DomainEventLog"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "DomainEventLog_idempotencyKey_key" ON "DomainEventLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DomainEventLog_status_availableAt_createdAt_idx" ON "DomainEventLog"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "DomainEventLog_actorId_type_occurredAt_idx" ON "DomainEventLog"("actorId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "DomainEventLog_correlationId_idx" ON "DomainEventLog"("correlationId");

-- CreateIndex
CREATE INDEX "DomainEventConsumerReceipt_consumerKey_status_idx" ON "DomainEventConsumerReceipt"("consumerKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DomainEventConsumerReceipt_eventId_consumerKey_key" ON "DomainEventConsumerReceipt"("eventId", "consumerKey");

-- AddForeignKey
ALTER TABLE "DomainEventConsumerReceipt" ADD CONSTRAINT "DomainEventConsumerReceipt_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DomainEventLog"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;
