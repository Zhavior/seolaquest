# Backend production runbook: phases 0 and 1

Status: implementation and local verification complete; production database cutover is blocked. The Phase 4 runbook supersedes this document's original `/api/v1/cron/scan` and cached manual-scan contracts with `/api/v1/cron/jobs` and durable scan acceptance.

## What these phases fix

Phase 0 removes immediate false or unsafe behavior:

- the cron route fails closed when `CRON_SECRET` is absent and rejects an invalid bearer token;
- this phase originally pointed Vercel Cron at `/api/v1/cron/scan`; Phase 4 retires that route and makes `/api/v1/cron/jobs` the only scheduler;
- the manual scan endpoint returns only tenant-scoped cached leads and charges zero credits;
- fabricated intent scores, rewards, dollar estimates, timestamps, and sources are removed;
- generated/local runtime artifacts are excluded from Git.

Phase 1 makes the PostgreSQL schema reproducible:

- `00000000000000_live_baseline` describes the exact production structure observed on 2026-07-29;
- the two older migration IDs are retained as no-op compatibility records;
- `20260729223000_reconcile_production_schema` adds webhook idempotency storage, the missing CRM timestamp, indexes, uniqueness, validated data checks, and Data API isolation;
- clean installation and existing-database adoption are both tested against PostgreSQL 17.

## Confirmed production state before cutover

Observed on 2026-07-29:

- live tables: `User`, `TrackedKeyword`, `Lead`, and `Post`;
- no `_prisma_migrations` table;
- no `ProcessedWebhook` table, so Stripe webhook processing cannot currently record idempotency;
- no `Lead.crmExportedAt` column;
- row-level security is disabled on all four application tables;
- `anon` and `authenticated` have table privileges;
- the runtime database URL uses the transaction pooler;
- the session-pool migration connection is saturated;
- no restorable physical backup or PITR restore point was reported by the inspected Supabase project.

An application-level recovery snapshot exists outside the repository at:

`/Users/boydsantos/.codex/backups/hypequest/2026-07-29-phase0/hypequest-application-snapshot.json`

It contains the four application tables plus catalog metadata and has a SHA-256 checksum. It is not a substitute for a full Supabase physical or logical backup.

## Hard production gate

Do not run `prisma migrate deploy`, `prisma db push`, or raw reconciliation SQL against production until every item below is true:

1. Obtain and verify a full restorable Supabase backup or a complete `pg_dump`.
2. Restore a usable direct or session-pool connection and add it as production `DIRECT_URL`.
3. Pause writes, Vercel Cron, and Stripe webhook delivery for the cutover window.
4. Re-run the duplicate, orphan, enum, and nonnegative-value preflight queries.
5. Confirm the database target and backup timestamp with a second operator.

## Production cutover commands

Run only after the hard gate passes. Never paste secrets into shell history; load them from the approved secret store.

```bash
npx prisma validate
npx prisma migrate status
npx prisma migrate resolve --applied 00000000000000_live_baseline
npx prisma migrate resolve --applied 20260728120000_initial_postgres_schema
npx prisma migrate resolve --applied 20260728123000_add_password_hash
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
```

The three `resolve` commands record structures already present in production. They must not execute their SQL there. The reconciliation migration is the only migration that should execute during adoption.

## Post-cutover proof

Verify all of the following before resuming traffic:

- all five application tables have row-level security enabled;
- `anon` and `authenticated` have no privileges on those tables;
- `ProcessedWebhook.eventId`, `User.stripeCustomerId`, and `(TrackedKeyword.userId, TrackedKeyword.phrase)` are unique;
- all expected indexes exist;
- the three `User` check constraints are validated;
- the four original table row counts match the pre-cutover counts;
- a signed Stripe test webhook succeeds once and is ignored on replay;
- an unauthorized cron call returns `401`, while a correctly authorized call reaches the scanner;
- a manual scan returns cached results with `creditsDeducted: 0` and does not mutate the user.

## Required production environment

Production must contain, at minimum:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXTAUTH_URL`
- `CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BETA`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

The Stripe endpoint must target `/api/v1/webhooks/stripe`. Environment changes require a new Vercel deployment before the running application receives them.

## Rollback boundary

If reconciliation fails, keep application traffic paused. Do not edit or delete migration history. Capture the exact Prisma error and inspect `_prisma_migrations`. Restore from the verified full backup if any committed change cannot be safely rolled forward. The reconciliation is expand-only, but RLS and privilege changes can make Data API access fail closed by design.
