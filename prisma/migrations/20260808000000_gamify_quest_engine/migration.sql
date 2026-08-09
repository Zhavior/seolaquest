-- Phase 4: Gamify Quest Engine

CREATE TABLE "GamifyQuest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "target" INTEGER NOT NULL,
    "rewardXp" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamifyQuest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GamifyQuest_version_check" CHECK ("version" >= 1),
    CONSTRAINT "GamifyQuest_type_check" CHECK ("type" IN ('ONBOARDING', 'DAILY', 'WEEKLY', 'MILESTONE', 'AURORA')),
    CONSTRAINT "GamifyQuest_eventVersion_check" CHECK ("eventVersion" >= 1),
    CONSTRAINT "GamifyQuest_target_check" CHECK ("target" > 0),
    CONSTRAINT "GamifyQuest_rewardXp_check" CHECK ("rewardXp" >= 0),
    CONSTRAINT "GamifyQuest_schedule_check" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" < "endsAt")
);

CREATE TABLE "GamifyQuestAssignment" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL DEFAULT 'once',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "rewardXp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "GamifyQuestAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GamifyQuestAssignment_progress_check" CHECK ("progress" >= 0 AND "progress" <= "target"),
    CONSTRAINT "GamifyQuestAssignment_target_check" CHECK ("target" > 0),
    CONSTRAINT "GamifyQuestAssignment_rewardXp_check" CHECK ("rewardXp" >= 0),
    CONSTRAINT "GamifyQuestAssignment_status_check" CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED')),
    CONSTRAINT "GamifyQuestAssignment_lifecycle_check" CHECK (
        ("status" = 'IN_PROGRESS' AND "completedAt" IS NULL AND "claimedAt" IS NULL)
        OR ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "claimedAt" IS NULL)
        OR ("status" = 'CLAIMED' AND "completedAt" IS NOT NULL AND "claimedAt" IS NOT NULL)
        OR ("status" = 'EXPIRED' AND "completedAt" IS NULL AND "claimedAt" IS NULL)
    )
);

CREATE TABLE "GamifyQuestContribution" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceEventType" TEXT NOT NULL,
    "sourceEventVersion" INTEGER NOT NULL,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamifyQuestContribution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GamifyQuestContribution_eventVersion_check" CHECK ("sourceEventVersion" >= 1),
    CONSTRAINT "GamifyQuestContribution_increment_check" CHECK ("increment" > 0)
);

CREATE UNIQUE INDEX "GamifyQuest_code_version_key" ON "GamifyQuest"("code", "version");
CREATE INDEX "GamifyQuest_eventType_eventVersion_enabled_idx" ON "GamifyQuest"("eventType", "eventVersion", "enabled");
CREATE INDEX "GamifyQuest_enabled_startsAt_endsAt_idx" ON "GamifyQuest"("enabled", "startsAt", "endsAt");

CREATE UNIQUE INDEX "GamifyQuestAssignment_actorId_questId_cycleKey_key" ON "GamifyQuestAssignment"("actorId", "questId", "cycleKey");
CREATE INDEX "GamifyQuestAssignment_actorId_status_assignedAt_idx" ON "GamifyQuestAssignment"("actorId", "status", "assignedAt");
CREATE INDEX "GamifyQuestAssignment_status_expiresAt_idx" ON "GamifyQuestAssignment"("status", "expiresAt");

CREATE UNIQUE INDEX "GamifyQuestContribution_assignmentId_sourceEventId_key" ON "GamifyQuestContribution"("assignmentId", "sourceEventId");
CREATE INDEX "GamifyQuestContribution_sourceEventId_idx" ON "GamifyQuestContribution"("sourceEventId");
CREATE INDEX "GamifyQuestContribution_assignmentId_createdAt_idx" ON "GamifyQuestContribution"("assignmentId", "createdAt");

ALTER TABLE "GamifyQuestAssignment"
    ADD CONSTRAINT "GamifyQuestAssignment_questId_fkey"
    FOREIGN KEY ("questId") REFERENCES "GamifyQuest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GamifyQuestAssignment"
    ADD CONSTRAINT "GamifyQuestAssignment_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "GamifyProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GamifyQuestContribution"
    ADD CONSTRAINT "GamifyQuestContribution_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "GamifyQuestAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Quest definitions and progress are managed by trusted server-side services.
REVOKE ALL ON TABLE
    "GamifyQuest",
    "GamifyQuestAssignment",
    "GamifyQuestContribution"
FROM anon, authenticated;

ALTER TABLE "GamifyQuest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GamifyQuestAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GamifyQuestContribution" ENABLE ROW LEVEL SECURITY;
