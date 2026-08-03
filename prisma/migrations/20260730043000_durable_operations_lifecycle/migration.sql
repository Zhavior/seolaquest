-- Phases 4-5: durable work orchestration and verified account lifecycle.
-- Forward-only. Keep DURABLE_WORKER_ENABLED=false until the production backup
-- and migration gates in the backend runbook have passed.

-- Prisma maps these DateTime columns to timestamp without time zone. Queue
-- comparisons therefore require every migration/runtime session to use UTC;
-- fail here instead of creating a queue that silently delays or early-runs work.
DO $$
BEGIN
    IF current_setting('TimeZone') NOT IN ('UTC', 'Etc/UTC', 'GMT') THEN
        RAISE EXCEPTION
            'Phase 4-5 requires a UTC database session; current TimeZone is %',
            current_setting('TimeZone');
    END IF;
END $$;

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "TrackedKeyword"
        WHERE "active" = true
        GROUP BY "userId"
        HAVING COUNT(*) > 10
    ) THEN
        RAISE EXCEPTION
            'Phase 4 requires no more than 10 active keywords per tenant; reconcile over-limit tenants first';
    END IF;
END $$;

CREATE TABLE "TenantScanSchedule" (
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "nextDueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnqueuedAt" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantScanSchedule_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "ScanRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "activeKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "providerSucceeded" BOOLEAN,
    "leadsCreated" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScanRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmExportDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL,
    "destinationFingerprint" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "deliveredAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmExportDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DurableJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT NOT NULL,
    "scanRunId" TEXT,
    "crmDeliveryId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseGeneration" INTEGER NOT NULL DEFAULT 0,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "completedAt" TIMESTAMP(3),
    "deadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DurableJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClerkWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClerkWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "subjectDigest" TEXT NOT NULL,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionAudit" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "subjectDigest" TEXT NOT NULL,
    "stripeCustomerDigest" TEXT,
    "source" TEXT NOT NULL,
    "resultCode" TEXT NOT NULL,
    "userRowsDeleted" INTEGER NOT NULL,
    "keywordRowsDeleted" INTEGER NOT NULL,
    "leadRowsDeleted" INTEGER NOT NULL,
    "postRowsDeleted" INTEGER NOT NULL,
    "checkoutRowsDeleted" INTEGER NOT NULL,
    "ledgerRowsDeleted" INTEGER NOT NULL,
    "billingRowsDeleted" INTEGER NOT NULL DEFAULT 0,
    "durableJobRowsDeleted" INTEGER NOT NULL DEFAULT 0,
    "scanRunRowsDeleted" INTEGER NOT NULL DEFAULT 0,
    "crmDeliveryRowsDeleted" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountDeletionAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalHeartbeat" (
    "id" TEXT NOT NULL,
    "lastStartedAt" TIMESTAMP(3) NOT NULL,
    "lastSucceededAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperationalHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScanRun_activeKey_key" ON "ScanRun"("activeKey");
CREATE INDEX "ScanRun_userId_createdAt_idx" ON "ScanRun"("userId", "createdAt");
CREATE INDEX "ScanRun_status_createdAt_idx" ON "ScanRun"("status", "createdAt");
CREATE INDEX "TenantScanSchedule_enabled_nextDueAt_userId_idx"
    ON "TenantScanSchedule"("enabled", "nextDueAt", "userId");
CREATE UNIQUE INDEX "CrmExportDelivery_leadId_key" ON "CrmExportDelivery"("leadId");
CREATE INDEX "CrmExportDelivery_userId_createdAt_idx"
    ON "CrmExportDelivery"("userId", "createdAt");
CREATE INDEX "CrmExportDelivery_status_createdAt_idx"
    ON "CrmExportDelivery"("status", "createdAt");
CREATE UNIQUE INDEX "DurableJob_dedupeKey_key" ON "DurableJob"("dedupeKey");
CREATE UNIQUE INDEX "DurableJob_scanRunId_key" ON "DurableJob"("scanRunId");
CREATE UNIQUE INDEX "DurableJob_crmDeliveryId_key" ON "DurableJob"("crmDeliveryId");
CREATE INDEX "DurableJob_status_nextAttemptAt_createdAt_idx"
    ON "DurableJob"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "DurableJob_userId_status_nextAttemptAt_idx"
    ON "DurableJob"("userId", "status", "nextAttemptAt");
CREATE INDEX "DurableJob_leaseExpiresAt_idx" ON "DurableJob"("leaseExpiresAt");
CREATE UNIQUE INDEX "ClerkWebhookEvent_eventId_key" ON "ClerkWebhookEvent"("eventId");
CREATE UNIQUE INDEX "AccountDeletionRequest_subjectDigest_key"
    ON "AccountDeletionRequest"("subjectDigest");
CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");
CREATE INDEX "AccountDeletionRequest_status_availableAt_idx"
    ON "AccountDeletionRequest"("status", "availableAt");
CREATE INDEX "AccountDeletionRequest_leaseExpiresAt_idx"
    ON "AccountDeletionRequest"("leaseExpiresAt");
CREATE INDEX "AccountDeletionRequest_stripeCustomerId_idx"
    ON "AccountDeletionRequest"("stripeCustomerId");
CREATE UNIQUE INDEX "AccountDeletionAudit_requestId_key" ON "AccountDeletionAudit"("requestId");
CREATE UNIQUE INDEX "AccountDeletionAudit_subjectDigest_key"
    ON "AccountDeletionAudit"("subjectDigest");
CREATE UNIQUE INDEX "AccountDeletionAudit_stripeCustomerDigest_key"
    ON "AccountDeletionAudit"("stripeCustomerDigest");

ALTER TABLE "TenantScanSchedule" ADD CONSTRAINT "TenantScanSchedule_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmExportDelivery" ADD CONSTRAINT "CrmExportDelivery_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmExportDelivery" ADD CONSTRAINT "CrmExportDelivery_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_scanRunId_fkey"
    FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_crmDeliveryId_fkey"
    FOREIGN KEY ("crmDeliveryId") REFERENCES "CrmExportDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_trigger_check"
    CHECK ("trigger" IN ('MANUAL', 'SCHEDULED'));
ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_status_check"
    CHECK ("status" IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED_REFUNDED'));
ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_leadsCreated_check" CHECK ("leadsCreated" >= 0);
ALTER TABLE "CrmExportDelivery" ADD CONSTRAINT "CrmExportDelivery_status_check"
    CHECK ("status" IN ('QUEUED', 'DELIVERED', 'DEAD'));
ALTER TABLE "CrmExportDelivery" ADD CONSTRAINT "CrmExportDelivery_responseStatus_check"
    CHECK ("responseStatus" IS NULL OR "responseStatus" BETWEEN 100 AND 599);
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_kind_check"
    CHECK ("kind" IN ('TENANT_SCAN', 'CRM_EXPORT'));
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_status_check"
    CHECK ("status" IN ('PENDING', 'RUNNING', 'RETRY_WAIT', 'SUCCEEDED', 'DEAD', 'CANCELLED'));
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_attempts_check"
    CHECK ("attempts" >= 0 AND "maxAttempts" BETWEEN 1 AND 20 AND "leaseGeneration" >= 0);
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_target_check" CHECK (
    ("kind" = 'TENANT_SCAN' AND "scanRunId" IS NOT NULL AND "crmDeliveryId" IS NULL)
    OR ("kind" = 'CRM_EXPORT' AND "crmDeliveryId" IS NOT NULL AND "scanRunId" IS NULL)
);
ALTER TABLE "DurableJob" ADD CONSTRAINT "DurableJob_lease_check" CHECK (
    ("status" = 'RUNNING' AND "leaseOwner" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL)
    OR "status" <> 'RUNNING'
);
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_status_check"
    CHECK ("status" IN ('AWAITING_IDENTITY_DELETE', 'PENDING', 'RUNNING', 'RETRY_WAIT', 'COMPLETED', 'DEAD'));
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_attempts_check"
    CHECK ("attempts" >= 0 AND "maxAttempts" BETWEEN 1 AND 20);
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_lease_check" CHECK (
    ("status" = 'RUNNING' AND "leaseToken" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL)
    OR "status" <> 'RUNNING'
);
ALTER TABLE "AccountDeletionAudit" ADD CONSTRAINT "AccountDeletionAudit_counts_check" CHECK (
    "userRowsDeleted" >= 0
    AND "keywordRowsDeleted" >= 0
    AND "leadRowsDeleted" >= 0
    AND "postRowsDeleted" >= 0
    AND "checkoutRowsDeleted" >= 0
    AND "ledgerRowsDeleted" >= 0
    AND "billingRowsDeleted" >= 0
    AND "durableJobRowsDeleted" >= 0
    AND "scanRunRowsDeleted" >= 0
    AND "crmDeliveryRowsDeleted" >= 0
);

-- Schedules are inert until the worker cutover switch is enabled. Backfilling
-- them now prevents lexicographically early tenants from monopolizing dispatch.
INSERT INTO "TenantScanSchedule" (
    "userId", "enabled", "nextDueAt", "createdAt", "updatedAt"
)
SELECT DISTINCT
    "userId", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "TrackedKeyword"
WHERE "active" = true
ON CONFLICT ("userId") DO NOTHING;

REVOKE ALL ON TABLE
    "TenantScanSchedule",
    "ScanRun",
    "CrmExportDelivery",
    "DurableJob",
    "ClerkWebhookEvent",
    "AccountDeletionRequest",
    "AccountDeletionAudit",
    "OperationalHeartbeat"
FROM anon, authenticated;

ALTER TABLE "TenantScanSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScanRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrmExportDelivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DurableJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClerkWebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountDeletionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountDeletionAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OperationalHeartbeat" ENABLE ROW LEVEL SECURITY;

COMMIT;
