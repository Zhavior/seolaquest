-- Phase 3: Gamify OS Foundation

CREATE TABLE "GamifyProfile" (
    "userId" TEXT NOT NULL,
    "lifetimeXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamifyProfile_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "GamifyProfile_lifetimeXp_check" CHECK ("lifetimeXp" >= 0),
    CONSTRAINT "GamifyProfile_level_check" CHECK ("level" >= 1),
    CONSTRAINT "GamifyProfile_reputation_check" CHECK ("reputation" >= 0)
);

CREATE TABLE "GamifyXpTransaction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "targetKey" TEXT,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamifyXpTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GamifyXpTransaction_entryType_check" CHECK ("entryType" IN ('AWARD', 'REVERSAL')),
    CONSTRAINT "GamifyXpTransaction_amount_direction_check" CHECK (
        ("entryType" = 'AWARD' AND "amount" > 0 AND "reversalOfId" IS NULL)
        OR
        ("entryType" = 'REVERSAL' AND "amount" < 0 AND "reversalOfId" IS NOT NULL)
    )
);

CREATE TABLE "GamifyReputationTransaction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "targetKey" TEXT,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "entryType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamifyReputationTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GamifyReputationTransaction_entryType_check" CHECK ("entryType" IN ('AWARD', 'REVERSAL')),
    CONSTRAINT "GamifyReputationTransaction_amount_direction_check" CHECK (
        ("entryType" = 'AWARD' AND "amount" > 0 AND "reversalOfId" IS NULL)
        OR
        ("entryType" = 'REVERSAL' AND "amount" < 0 AND "reversalOfId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "GamifyXpTransaction_idempotencyKey_key" ON "GamifyXpTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "GamifyXpTransaction_reversalOfId_key" ON "GamifyXpTransaction"("reversalOfId");
CREATE INDEX "GamifyXpTransaction_actorId_createdAt_idx" ON "GamifyXpTransaction"("actorId", "createdAt");
CREATE INDEX "GamifyXpTransaction_actorId_ruleId_targetKey_idx" ON "GamifyXpTransaction"("actorId", "ruleId", "targetKey");
CREATE INDEX "GamifyXpTransaction_sourceEventId_idx" ON "GamifyXpTransaction"("sourceEventId");

CREATE UNIQUE INDEX "GamifyReputationTransaction_idempotencyKey_key" ON "GamifyReputationTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "GamifyReputationTransaction_reversalOfId_key" ON "GamifyReputationTransaction"("reversalOfId");
CREATE INDEX "GamifyReputationTransaction_actorId_createdAt_idx" ON "GamifyReputationTransaction"("actorId", "createdAt");
CREATE INDEX "GamifyReputationTransaction_actorId_ruleId_targetKey_idx" ON "GamifyReputationTransaction"("actorId", "ruleId", "targetKey");
CREATE INDEX "GamifyReputationTransaction_sourceEventId_idx" ON "GamifyReputationTransaction"("sourceEventId");

ALTER TABLE "GamifyProfile"
    ADD CONSTRAINT "GamifyProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GamifyXpTransaction"
    ADD CONSTRAINT "GamifyXpTransaction_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "GamifyProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GamifyXpTransaction"
    ADD CONSTRAINT "GamifyXpTransaction_reversalOfId_fkey"
    FOREIGN KEY ("reversalOfId") REFERENCES "GamifyXpTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GamifyReputationTransaction"
    ADD CONSTRAINT "GamifyReputationTransaction_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "GamifyProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GamifyReputationTransaction"
    ADD CONSTRAINT "GamifyReputationTransaction_reversalOfId_fkey"
    FOREIGN KEY ("reversalOfId") REFERENCES "GamifyReputationTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
