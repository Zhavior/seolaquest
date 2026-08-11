-- Blog articles move off the filesystem and into the database.
--
-- content/posts/*.mdx cannot be written at runtime on Vercel (read-only
-- filesystem), so the automated generator has nowhere to save a draft. This
-- table is that home. Existing MDX files are imported by
-- scripts/import-mdx-posts.ts; this migration only creates the table.

CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REJECTED');
CREATE TYPE "BlogPostSource" AS ENUM ('AI_GENERATED', 'IMPORTED', 'MANUAL');

CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '[ALL]',
    "author" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "authorAvatar" TEXT NOT NULL,
    "coverColor" TEXT NOT NULL DEFAULT '#FFE600',
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 1,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "BlogPostSource" NOT NULL DEFAULT 'AI_GENERATED',
    "topic" TEXT,
    "publishedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "discordMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BlogPost_readTimeMinutes_check" CHECK ("readTimeMinutes" >= 1)
);

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE UNIQUE INDEX "BlogPost_discordMessageId_key" ON "BlogPost"("discordMessageId");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
