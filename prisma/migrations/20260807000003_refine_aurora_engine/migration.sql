-- DropIndex
DROP INDEX "AuroraDecision_sourceEventId_policyVersion_key";

-- AlterTable
ALTER TABLE "AuroraDecision" ADD COLUMN     "semanticFailureCode" TEXT,
ALTER COLUMN "semanticSignals" DROP NOT NULL,
ALTER COLUMN "classifierProvider" DROP NOT NULL,
ALTER COLUMN "classifierModel" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AuroraDecision_sourceEventId_deterministicScorerVersion_cla_key" ON "AuroraDecision"("sourceEventId", "deterministicScorerVersion", "classifierVersion", "policyVersion");

-- Add CHECK constraints
ALTER TABLE "AuroraDecision" ADD CONSTRAINT "AuroraDecision_finalScore_check" CHECK ("finalScore" >= 0 AND "finalScore" <= 100);
ALTER TABLE "AuroraDecision" ADD CONSTRAINT "AuroraDecision_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 100);
