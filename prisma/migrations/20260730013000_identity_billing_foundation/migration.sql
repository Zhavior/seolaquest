-- Phase 2-3 identity and billing foundation.
-- This migration is forward-only and must remain behind the Phase 1 backup gate.

BEGIN;

-- Clerk owns credentials. The legacy column may contain values created by an
-- unsafe local signup implementation and must not remain part of the product.
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "latestStripeEventCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

-- Preserve legacy Stripe customer links for reconciliation, but fail closed:
-- without a verified Stripe subscription and price they remain FREE/inactive.
INSERT INTO "BillingSubscription" (
    "id",
    "userId",
    "stripeCustomerId",
    "plan",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'legacy_' || "id",
    "id",
    "stripeCustomerId",
    'FREE',
    'inactive',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE "stripeCustomerId" IS NOT NULL
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS "User_stripeCustomerId_key";
ALTER TABLE "User"
    DROP COLUMN IF EXISTS "stripeCustomerId",
    DROP COLUMN IF EXISTS "plan",
    DROP COLUMN IF EXISTS "subscriptionStatus",
    DROP COLUMN IF EXISTS "subscriptionTier";

-- New free accounts start with no paid scan balance. This changes defaults
-- only; legacy balances remain untouched for explicit reconciliation.
ALTER TABLE "User"
    ALTER COLUMN "questsRemaining" SET DEFAULT 0,
    ALTER COLUMN "maxCredits" SET DEFAULT 0;

CREATE UNIQUE INDEX "BillingSubscription_userId_key"
    ON "BillingSubscription"("userId");
CREATE UNIQUE INDEX "BillingSubscription_stripeCustomerId_key"
    ON "BillingSubscription"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingSubscription_stripeSubscriptionId_key"
    ON "BillingSubscription"("stripeSubscriptionId");
CREATE INDEX "BillingSubscription_status_idx"
    ON "BillingSubscription"("status");
ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_plan_check"
    CHECK ("plan" IN ('FREE', 'BETA', 'PRO', 'AGENCY'));
ALTER TABLE "BillingSubscription"
    ADD CONSTRAINT "BillingSubscription_status_check"
    CHECK ("status" IN (
        'inactive',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
    ));

CREATE TABLE "CheckoutIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "expectedAmount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "activeKey" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeCheckoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CheckoutIntent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CheckoutIntent_activeKey_key"
    ON "CheckoutIntent"("activeKey");
CREATE UNIQUE INDEX "CheckoutIntent_stripeCheckoutSessionId_key"
    ON "CheckoutIntent"("stripeCheckoutSessionId");
CREATE INDEX "CheckoutIntent_userId_createdAt_idx"
    ON "CheckoutIntent"("userId", "createdAt");
ALTER TABLE "CheckoutIntent"
    ADD CONSTRAINT "CheckoutIntent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckoutIntent"
    ADD CONSTRAINT "CheckoutIntent_kind_check"
    CHECK ("kind" IN ('SUBSCRIPTION', 'POTION'));
ALTER TABLE "CheckoutIntent"
    ADD CONSTRAINT "CheckoutIntent_status_check"
    CHECK ("status" IN ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED'));
ALTER TABLE "CheckoutIntent"
    ADD CONSTRAINT "CheckoutIntent_expectedAmount_check"
    CHECK ("expectedAmount" IS NULL OR "expectedAmount" > 0);

ALTER TABLE "ProcessedWebhook"
    ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'unknown',
    ADD COLUMN "objectId" TEXT,
    ADD COLUMN "livemode" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "stripeCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "error" TEXT,
    ADD COLUMN "processedAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Rows written by the legacy handler already represent accepted deliveries.
-- Mark them terminal before the new retryable inbox starts processing events.
UPDATE "ProcessedWebhook"
SET
    "status" = 'PROCESSED',
    "processedAt" = "createdAt",
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "eventType" = 'unknown';
ALTER TABLE "ProcessedWebhook"
    ALTER COLUMN "eventType" DROP DEFAULT,
    ALTER COLUMN "livemode" DROP DEFAULT,
    ALTER COLUMN "stripeCreatedAt" DROP DEFAULT,
    ALTER COLUMN "updatedAt" DROP DEFAULT;
CREATE INDEX "ProcessedWebhook_status_createdAt_idx"
    ON "ProcessedWebhook"("status", "createdAt");
ALTER TABLE "ProcessedWebhook"
    ADD CONSTRAINT "ProcessedWebhook_status_check"
    CHECK ("status" IN ('PROCESSING', 'PROCESSED', 'FAILED'));
ALTER TABLE "ProcessedWebhook"
    ADD CONSTRAINT "ProcessedWebhook_attempts_check"
    CHECK ("attempts" >= 1);

CREATE TABLE "CreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CreditLedgerEntry_sourceType_sourceId_key"
    ON "CreditLedgerEntry"("sourceType", "sourceId");
CREATE INDEX "CreditLedgerEntry_userId_createdAt_idx"
    ON "CreditLedgerEntry"("userId", "createdAt");
ALTER TABLE "CreditLedgerEntry"
    ADD CONSTRAINT "CreditLedgerEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditLedgerEntry"
    ADD CONSTRAINT "CreditLedgerEntry_nonzero_delta_check"
    CHECK ("delta" <> 0);

-- This app uses Clerk and trusted server-side Postgres connections. Browser
-- Data API roles must never receive access to newly created internal tables.
REVOKE ALL ON TABLE
    "BillingSubscription",
    "CheckoutIntent",
    "ProcessedWebhook",
    "CreditLedgerEntry"
FROM anon, authenticated;
ALTER TABLE "BillingSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutIntent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedWebhook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditLedgerEntry" ENABLE ROW LEVEL SECURITY;

-- Older Supabase projects can automatically grant Data API roles access to
-- future public objects. Make future exposure explicit and migration-owned.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE USAGE, SELECT, UPDATE ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

COMMIT;
