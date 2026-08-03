-- Phase 6: provider-level scan evidence and multi-keyword lead provenance.
-- Forward-only and safe for existing leads/runs.

BEGIN;

-- Scheduling is fail-closed until a tenant has an explicit persisted opt-in.
-- Existing rows came from the Phase 4 backfill and therefore are not consent.
ALTER TABLE "TenantScanSchedule" ALTER COLUMN "enabled" SET DEFAULT false;
UPDATE "TenantScanSchedule" SET "enabled" = false WHERE "enabled" = true;

ALTER TABLE "Lead" ADD COLUMN "observedAt" TIMESTAMP(3);
UPDATE "Lead" SET "observedAt" = "createdAt" WHERE "observedAt" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "observedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Lead" ALTER COLUMN "observedAt" SET NOT NULL;

CREATE TABLE "ProviderScanAttempt" (
    "id" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "keywordId" TEXT,
    "keywordSnapshot" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "httpStatusClass" INTEGER,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "insertedCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderScanAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadMatch" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "providerScanAttemptId" TEXT NOT NULL,
    "keywordId" TEXT,
    "keywordSnapshot" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderScanAttempt_scanRunId_provider_keywordSnapshot_key"
    ON "ProviderScanAttempt"("scanRunId", "provider", "keywordSnapshot");
CREATE INDEX "ProviderScanAttempt_scanRunId_provider_outcome_idx"
    ON "ProviderScanAttempt"("scanRunId", "provider", "outcome");
CREATE INDEX "ProviderScanAttempt_keywordId_idx" ON "ProviderScanAttempt"("keywordId");
CREATE UNIQUE INDEX "LeadMatch_leadId_providerScanAttemptId_key"
    ON "LeadMatch"("leadId", "providerScanAttemptId");
CREATE INDEX "LeadMatch_scanRunId_matchedAt_idx" ON "LeadMatch"("scanRunId", "matchedAt");
CREATE INDEX "LeadMatch_keywordId_idx" ON "LeadMatch"("keywordId");

ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_scanRunId_fkey"
    FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_keywordId_fkey"
    FOREIGN KEY ("keywordId") REFERENCES "TrackedKeyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadMatch" ADD CONSTRAINT "LeadMatch_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadMatch" ADD CONSTRAINT "LeadMatch_scanRunId_fkey"
    FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadMatch" ADD CONSTRAINT "LeadMatch_providerScanAttemptId_fkey"
    FOREIGN KEY ("providerScanAttemptId") REFERENCES "ProviderScanAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadMatch" ADD CONSTRAINT "LeadMatch_keywordId_fkey"
    FOREIGN KEY ("keywordId") REFERENCES "TrackedKeyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_provider_check"
    CHECK ("provider" IN ('REDDIT', 'X'));
ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_outcome_check"
    CHECK ("outcome" IN (
        'IN_PROGRESS', 'SUCCESS', 'ZERO_RESULTS', 'MALFORMED_RESPONSE',
        'RATE_LIMITED', 'PROVIDER_UNAVAILABLE'
    ));
ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_counts_check"
    CHECK ("resultCount" >= 0 AND "insertedCount" >= 0 AND "insertedCount" <= "resultCount");
ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_httpStatusClass_check"
    CHECK ("httpStatusClass" IS NULL OR "httpStatusClass" BETWEEN 1 AND 5);
ALTER TABLE "ProviderScanAttempt" ADD CONSTRAINT "ProviderScanAttempt_completion_check"
    CHECK (
        ("outcome" = 'IN_PROGRESS' AND "completedAt" IS NULL)
        OR ("outcome" <> 'IN_PROGRESS' AND "completedAt" IS NOT NULL)
    );

REVOKE ALL ON TABLE "ProviderScanAttempt", "LeadMatch" FROM anon, authenticated;
ALTER TABLE "ProviderScanAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadMatch" ENABLE ROW LEVEL SECURITY;

COMMIT;
