-- CreateTable
CREATE TABLE "AuroraDecision" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "deterministicSignals" JSONB NOT NULL,
    "semanticSignals" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "policyFlags" JSONB NOT NULL,
    "classifierProvider" TEXT NOT NULL,
    "classifierModel" TEXT NOT NULL,
    "classifierVersion" TEXT NOT NULL,
    "deterministicScorerVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "evaluationStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuroraDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuroraFeedback" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "correction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuroraFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuroraDecision_opportunityId_idx" ON "AuroraDecision"("opportunityId");

-- CreateIndex
CREATE INDEX "AuroraDecision_recommendedAction_priority_idx" ON "AuroraDecision"("recommendedAction", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "AuroraDecision_sourceEventId_policyVersion_key" ON "AuroraDecision"("sourceEventId", "policyVersion");

-- CreateIndex
CREATE INDEX "AuroraFeedback_decisionId_idx" ON "AuroraFeedback"("decisionId");

-- CreateIndex
CREATE INDEX "AuroraFeedback_feedbackType_idx" ON "AuroraFeedback"("feedbackType");

-- AddForeignKey
ALTER TABLE "AuroraFeedback" ADD CONSTRAINT "AuroraFeedback_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "AuroraDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
