# Backend production runbook: Phase 4 durable operations

Status: implemented and verified locally, including fresh and seeded-upgrade PostgreSQL 17 rehearsals. The worker is disabled by default. Production activation remains blocked by the backup, direct-connection, deployed-preview, alerting, and provider replay gates below.

## Architecture contract

Phase 4 replaces inline provider and CRM work with a PostgreSQL-backed queue:

1. A customer action or due tenant schedule accepts work in one database transaction.
2. The transaction writes the business record, its economic ledger entry when applicable, and one `DurableJob`.
3. Vercel Cron calls `/api/v1/cron/jobs` once per minute with the exact `CRON_SECRET` bearer credential.
4. The worker claims a small, tenant-fair batch with PostgreSQL `FOR UPDATE SKIP LOCKED` and database time.
5. A lease owner plus monotonically increasing lease generation fences stale workers from completing, retrying, or killing reclaimed work.
6. Each job completes, enters bounded exponential retry, or becomes dead without aborting the rest of the cycle.

Vercel Cron is the only scheduler. The Trigger.dev task, configuration, and dependency and the legacy inline `LeadScraperService` path were removed.

## Required environment

```text
CRON_SECRET=<long random deployment secret>
DURABLE_WORKER_ENABLED=false
DATABASE_URL=<runtime transaction pooler>
DIRECT_URL=<migration or session connection>
TWITTER_BEARER_TOKEN=<optional>
```

The PostgreSQL database and every runtime/migration session must report
`SHOW TimeZone` as `UTC`, `Etc/UTC`, or `GMT`. Prisma maps the current timestamp
columns without a time-zone type, so the Phase 4-5 migration fails closed for a
non-UTC session and readiness stays degraded. Configure UTC at the database or
role level; do not rely on a developer laptop's local time zone.

Keep `DURABLE_WORKER_ENABLED=false` through migration and preview verification. The jobs route returns `503` when either the secret is missing or the worker is disabled, and `401` for every non-exact credential.

Before either worker runs, the route verifies the current database session time zone is `UTC`, `Etc/UTC`, or `GMT`. A non-UTC or unreadable session fails the cycle with `503`; this protects timestamp-without-time-zone queue columns from deployment/session drift.

The same cron cycle attempts account-deletion work first only when `ACCOUNT_DELETION_ENABLED=true`; otherwise it reports lifecycle work as disabled and continues with the durable queue. The destructive deletion worker still fails before claim unless the complete Clerk, audit-secret, and Stripe key/mode configuration is valid.

## Scan acceptance and charging

- A tenant can have at most 10 active keywords. Additions lock the tenant row before checking the cap so concurrent requests cannot overrun it.
- The migration refuses adoption if an existing tenant already exceeds that cap; reconcile those tenants with the customer before cutover.
- Every worker cycle idempotently creates a disabled schedule record for tenants with active keywords and disables schedules for tenants without them. Phase 6 removed implicit opt-in: adding a keyword never authorizes recurring credit consumption.
- Reconciliation completes in its own schedule-only transaction. Dispatch and keyword addition both acquire locks in `User` then `TenantScanSchedule` order, preventing the former schedule/user inversion.
- If any tenant has more than ten active keywords, the scheduler throws the `ACTIVE_KEYWORD_LIMIT_EXCEEDED` invariant error and the entire worker cycle stops before claiming provider work. Operators must reconcile the tenant; the provider also independently refuses an over-limit tenant.
- A manual or scheduled acceptance locks the tenant row and uses the database clock to derive one 15-minute deduplication window. Recurring schedules, if a future explicit opt-in enables them, advance no more often than once per 24 hours.
- `ScanRun.activeKey` prevents a second scan for the same tenant and window.
- Acceptance requires an active paid subscription, at least one active keyword, and at least one scan credit.
- `ScanRun`, the conditional credit decrement, `CreditLedgerEntry`, and `DurableJob` are created in the same transaction.
- The debit source is `SCAN_RUN_DEBIT` plus the immutable scan-run ID.
- The customer action returns `queued` and a run ID. It never reports provider success or fabricated lead counts before the worker finishes.

Reddit and an optionally configured X provider run with eight-second request timeouts. Phase 6 caps cross-provider fan-out at six concurrent requests within the enforced ten-keyword budget. Leads use bounded bulk writes against the tenant/external-post uniqueness boundary and record provider/keyword provenance.

A successful provider response is billable even when it returns zero leads. If every configured provider remains unavailable through the final attempt, the fenced terminal transaction:

- marks the job `DEAD`;
- inserts one `SCAN_RUN_REFUND` ledger entry with the scan-run ID;
- increments the balance only if that refund row was newly inserted; and
- marks the run `FAILED_REFUNDED`.

The reconciler applies the same idempotent repair to dead or stranded terminal runs. It does not refund healthy pending work or an actively leased job.

## Queue fairness and retry policy

- Due schedules are ordered by `nextDueAt`, then `userId`, and claimed with row locks plus `SKIP LOCKED`.
- Ready jobs are ordered by `nextAttemptAt`, creation time, and ID.
- An anti-join admits at most one ready job per tenant into a claim batch.
- An unexpired running job prevents another worker from processing additional work for that tenant.
- Expired leases are reclaimable and increment `leaseGeneration`.
- A cycle processes up to four jobs by default, with a hard maximum of 25. It claims one job only when it is ready to start that job, so wall-time exhaustion cannot consume attempts for unstarted work.
- Worker wall time defaults to 40 seconds within a 60-second route duration.
- Retry delay starts at five seconds, doubles per attempt, and caps at 15 minutes.
- Each job has a finite `maxAttempts`; exhausting it creates a dead letter.
- A worker crash on the final attempt is terminal after lease expiry: the job is marked dead instead of being reclaimed forever, CRM delivery is dead-lettered, and scan reconciliation applies the one-time refund.
- Expired final-attempt cleanup selects at most the bounded claim size with its own `FOR UPDATE SKIP LOCKED` candidate set. An incident backlog therefore cannot turn one cron invocation into an unbounded update; later cycles drain the rest while preserving CRM dead-letter propagation and scan refund reconciliation.
- A processor or failure-handler exception is isolated so one poisoned job cannot fail the remaining cycle.
- Scheduler or scan-refund reconciliation failure aborts the cycle before job claim and records a failed operational heartbeat. Per-job poison handling remains isolated after preparation succeeds, so a heartbeat never claims a fully healthy cycle after a partial preparation failure.

## CRM delivery contract

CRM export is **at-least-once delivery**, not exactly-once external delivery.

Acceptance stores an immutable JSON payload snapshot and the SHA-256 fingerprint of the normalized destination. It does not call the customer endpoint inline. Every delivery attempt:

1. loads and normalizes the tenant's current webhook URL;
2. requires its fingerprint to match the accepted destination;
3. resolves DNS again and rejects private, local, or mixed public/private answers;
4. pins HTTPS to a verified public address, disables redirects, and times out after five seconds; and
5. sends stable `Idempotency-Key` and `X-CoQuest-Delivery-Id` headers derived from the delivery ID.

After a 2xx response, one fenced transaction marks the job and delivery complete, marks the lead exported, and increments the tenant export counter once. A network failure after the destination accepts the request can cause a replay; destinations must honor the stable idempotency key to suppress duplicate side effects.

## Production cutover gate

Do not enable the worker until all of these are complete:

1. Obtain and restore-test a full production backup.
2. Confirm `DIRECT_URL` and complete the Phase 4-5 migration rehearsal.
   Confirm `SHOW TimeZone;` returns an accepted UTC value on both direct and runtime connections.
3. Deploy the schema and application with `DURABLE_WORKER_ENABLED=false`.
4. Confirm `/api/v1/cron/jobs` returns `503` while disabled, `401` for a wrong bearer, and never appears behind Clerk session middleware.
5. On a preview database, prove concurrent schedule and job claims with real PostgreSQL sessions.
   Include concurrent keyword addition and schedule dispatch, and verify the shared `User` then `TenantScanSchedule` lock order does not deadlock.
6. Kill a worker after lease acquisition and prove expired-lease reclaim plus generation fencing.
7. Replay the same manual scan acceptance concurrently and prove one run, one debit, and one job.
8. Force terminal provider failure and prove one refund after concurrent reconciliation.
9. Replay one CRM delivery with a lost response and verify the stable idempotency headers at a controlled destination.
10. Verify dead-letter and readiness endpoints with `OPS_SECRET`, alerts, and an operator response procedure.
11. Enable the worker in preview, observe at least one full schedule window, then explicitly approve production activation.

## Current verification and residual risk

Unit tests cover authorization fail-closed behavior, fair SQL claim shape, bounded expired-final-attempt cleanup, lease-generation fencing, bounded retries, poisoned-job isolation, scan debit/refund deduplication, zero-result success, provider partial failure, runtime schedule reconciliation, lock ordering, provider-budget failure, schedule ordering, CRM payload immutability, destination fingerprint checks, and stable delivery headers.

Local PostgreSQL 17 rehearsals now prove a clean six-migration deploy, a seeded legacy upgrade without data loss, UTC fail-closed behavior, disjoint tenant claims, expired-lease reclaim and fencing, one concurrent scan debit, one terminal refund, CRM enqueue deduplication, max-attempt draining, deletion replay, and deletion-versus-billing serialization. These are strong database-level proofs, but they do not prove behavior through the production pooler or simultaneous Vercel invocations. A deployed preview replay is still required to prove actual Vercel duration, provider latency, DNS behavior, destination idempotency, and the production connection topology.
