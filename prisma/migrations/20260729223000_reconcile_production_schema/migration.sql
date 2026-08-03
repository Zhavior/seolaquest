-- Expand-only reconciliation for the existing Supabase production database.
-- Safe to run after the canonical baseline is marked applied in migration history.

BEGIN;

CREATE TABLE IF NOT EXISTS "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead"
    ADD COLUMN IF NOT EXISTS "crmExportedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key"
    ON "User"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx"
    ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "TrackedKeyword_userId_active_idx"
    ON "TrackedKeyword"("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "TrackedKeyword_userId_phrase_key"
    ON "TrackedKeyword"("userId", "phrase");
CREATE INDEX IF NOT EXISTS "Lead_userId_status_createdAt_idx"
    ON "Lead"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_keywordId_idx"
    ON "Lead"("keywordId");
CREATE INDEX IF NOT EXISTS "Post_userId_createdAt_idx"
    ON "Post"("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedWebhook_eventId_key"
    ON "ProcessedWebhook"("eventId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'User_nonnegative_progression_check'
          AND conrelid = '"User"'::regclass
    ) THEN
        ALTER TABLE "User"
            ADD CONSTRAINT "User_nonnegative_progression_check" CHECK (
                "questsRemaining" >= 0
                AND "spellsCast" >= 0
                AND "questsExported" >= 0
                AND "maxCredits" >= 0
                AND "level" >= 1
                AND "xp" >= 0
                AND "xpRequired" >= 0
                AND "xpMultiplier" > 0
            ) NOT VALID;
    END IF;
END $$;

ALTER TABLE "User" VALIDATE CONSTRAINT "User_nonnegative_progression_check";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'User_plan_check'
          AND conrelid = '"User"'::regclass
    ) THEN
        ALTER TABLE "User"
            ADD CONSTRAINT "User_plan_check"
            CHECK ("plan" IN ('FREE', 'PRO')) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'User_subscriptionStatus_check'
          AND conrelid = '"User"'::regclass
    ) THEN
        ALTER TABLE "User"
            ADD CONSTRAINT "User_subscriptionStatus_check" CHECK (
                "subscriptionStatus" IN (
                    'inactive',
                    'incomplete',
                    'incomplete_expired',
                    'trialing',
                    'active',
                    'past_due',
                    'canceled',
                    'unpaid',
                    'paused'
                )
            ) NOT VALID;
    END IF;
END $$;

ALTER TABLE "User" VALIDATE CONSTRAINT "User_plan_check";
ALTER TABLE "User" VALIDATE CONSTRAINT "User_subscriptionStatus_check";

-- The application uses trusted server-side Prisma connections. These tables must
-- not be reachable through Supabase's anon/authenticated Data API roles.
REVOKE ALL ON TABLE "User", "TrackedKeyword", "Lead", "Post", "ProcessedWebhook"
FROM anon, authenticated;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackedKeyword" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessedWebhook" ENABLE ROW LEVEL SECURITY;

COMMIT;
