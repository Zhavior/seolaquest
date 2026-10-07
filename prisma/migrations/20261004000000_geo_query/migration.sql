-- CreateTable
CREATE TABLE "GeoQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "brandDomain" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "engineModel" TEXT,
    "enginePreset" TEXT,
    "providerResponseId" TEXT,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "answerText" TEXT,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "citedCount" INTEGER NOT NULL DEFAULT 0,
    "brandCited" BOOLEAN,
    "brandCitedRank" INTEGER,
    "brandRetrieved" BOOLEAN,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costUsd" DECIMAL(12,6),
    "costDetails" JSONB,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoQuery_userId_createdAt_idx" ON "GeoQuery"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GeoQuery" ADD CONSTRAINT "GeoQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Same lockdown as LeadOutcome: the app reaches this table through Prisma's
-- role only, never through Supabase's anon/authenticated PostgREST roles.
ALTER TABLE "GeoQuery" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "GeoQuery" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "GeoQuery" FROM anon; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "GeoQuery" FROM authenticated; END IF;
END $$;
