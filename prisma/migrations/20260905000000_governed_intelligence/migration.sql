-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'CLAIMED';
ALTER TYPE "LeadStatus" ADD VALUE 'REPLIED';
ALTER TYPE "LeadStatus" ADD VALUE 'QUALIFIED';
ALTER TYPE "LeadStatus" ADD VALUE 'CONVERTED';

-- DropIndex
DROP INDEX "AuroraDecision_opportunityId_idx";

-- AlterTable
ALTER TABLE "AuroraDecision" ADD COLUMN     "inputFingerprint" TEXT,
ADD COLUMN     "inputSnapshot" JSONB,
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "outputSchemaVersion" TEXT;

-- CreateTable
CREATE TABLE "LeadOutcome" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "decisionId" TEXT,
    "actorId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "LeadStatus" NOT NULL,
    "resultingStatus" "LeadStatus" NOT NULL,
    "evidenceKind" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "policyReasons" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadOutcome_leadId_createdAt_id_idx" ON "LeadOutcome"("leadId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LeadOutcome_leadId_idempotencyKey_key" ON "LeadOutcome"("leadId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AuroraDecision_opportunityId_createdAt_id_idx" ON "AuroraDecision"("opportunityId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "AuroraDecision" ADD CONSTRAINT "AuroraDecision_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AuroraDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Bind existing decisions only when their original opportunity still exists.
UPDATE "AuroraDecision" d SET "leadId" = l."id" FROM "Lead" l WHERE d."opportunityId" = l."id";
ALTER TABLE "AuroraDecision" ADD CONSTRAINT "AuroraDecision_lead_identity_check"
  CHECK ("leadId" IS NULL OR "leadId" = "opportunityId");
ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_evidence_check"
  CHECK (("action" IN ('CLAIM', 'DISMISS') AND "evidenceKind" = 'USER_ACTION')
      OR ("action" IN ('CONTACT', 'REPLY', 'QUALIFY', 'CONVERT') AND "evidenceKind" = 'CUSTOMER_REPORTED'));
ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_fingerprint_check"
  CHECK ("requestFingerprint" ~ '^[a-f0-9]{64}$');
ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_notes_check" CHECK (length("notes") <= 1000);
ALTER TABLE "LeadOutcome" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "LeadOutcome" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "LeadOutcome" FROM anon; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "LeadOutcome" FROM authenticated; END IF;
END $$;

-- Receipt contents cannot be rewritten. FK cleanup may clear a deleted decision reference.
CREATE FUNCTION protect_lead_outcome() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD AND NOT (
    OLD."decisionId" IS NOT NULL AND NEW."decisionId" IS NULL
    AND (to_jsonb(NEW) - 'decisionId') = (to_jsonb(OLD) - 'decisionId')
  ) THEN RAISE EXCEPTION 'Lead outcomes are immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "LeadOutcome_immutable" BEFORE UPDATE ON "LeadOutcome"
  FOR EACH ROW EXECUTE FUNCTION protect_lead_outcome();

CREATE FUNCTION check_lead_outcome_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Lead" WHERE "id" = NEW."leadId" AND "userId" = NEW."actorId")
    THEN RAISE EXCEPTION 'Outcome actor does not own lead'; END IF;
  IF NEW."decisionId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "AuroraDecision" WHERE "id" = NEW."decisionId" AND "opportunityId" = NEW."leadId"
  ) THEN RAISE EXCEPTION 'Outcome decision does not belong to lead'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "LeadOutcome_owner" BEFORE INSERT ON "LeadOutcome"
  FOR EACH ROW EXECUTE FUNCTION check_lead_outcome_owner();

CREATE FUNCTION protect_aurora_decision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Aurora decisions are immutable'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "AuroraDecision_immutable" BEFORE UPDATE ON "AuroraDecision"
  FOR EACH ROW EXECUTE FUNCTION protect_aurora_decision();
ALTER TABLE "AuroraDecision" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "AuroraDecision" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "AuroraDecision" FROM anon; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "AuroraDecision" FROM authenticated; END IF;
END $$;

ALTER TABLE "LeadOutcome" ADD CONSTRAINT "LeadOutcome_transition_check" CHECK (
  ("action" = 'CLAIM' AND "previousStatus"::text IN ('NEW', 'VIEWED') AND "resultingStatus"::text = 'CLAIMED') OR
  ("action" = 'DISMISS' AND "previousStatus"::text IN ('NEW', 'VIEWED', 'CLAIMED') AND "resultingStatus"::text = 'DISMISSED') OR
  ("action" = 'CONTACT' AND "previousStatus"::text IN ('NEW', 'VIEWED', 'CLAIMED') AND "resultingStatus"::text = 'CONTACTED') OR
  ("action" = 'REPLY' AND "previousStatus"::text = 'CONTACTED' AND "resultingStatus"::text = 'REPLIED') OR
  ("action" = 'QUALIFY' AND "previousStatus"::text IN ('CONTACTED', 'REPLIED') AND "resultingStatus"::text = 'QUALIFIED') OR
  ("action" = 'CONVERT' AND "previousStatus"::text IN ('CONTACTED', 'REPLIED', 'QUALIFIED') AND "resultingStatus"::text = 'CONVERTED')
);
