-- Phase 2: durable first-value onboarding state.
-- This migration is forward-only and intentionally does not start a scan,
-- grant credits, or alter existing keyword ownership.

BEGIN;

CREATE TYPE "OnboardingSource" AS ENUM ('REDDIT', 'X');

ALTER TABLE "User"
    ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "businessDescription" TEXT,
    ADD COLUMN "targetCustomer" TEXT,
    ADD COLUMN "firstKeyword" TEXT,
    ADD COLUMN "preferredSource" "OnboardingSource";

-- Existing completed accounts must remain excluded from onboarding.
UPDATE "User"
SET "onboardingStep" = 6
WHERE "onboardingComplete" = true;

ALTER TABLE "User"
    ADD CONSTRAINT "User_onboardingStep_check"
    CHECK ("onboardingStep" BETWEEN 1 AND 6);

COMMIT;
