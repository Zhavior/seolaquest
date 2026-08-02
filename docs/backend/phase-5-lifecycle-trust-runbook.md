# Backend production runbook: Phase 5 lifecycle and operational trust

Status: implemented and locally verified. Account deletion is disabled by default. No production webhook, customer, database, Stripe object, or deployment was changed during this phase.

## Architecture contract

Phase 5 makes destructive lifecycle work explicit, durable, and observable:

1. Clerk remains the identity authority.
2. A self-service request requires Clerk's strict reverification and the exact phrase `DELETE MY ACCOUNT`.
3. The application first commits an `AWAITING_IDENTITY_DELETE` request that freezes billing, then asks Clerk to delete the identity; it does not claim the local purge is already complete.
4. Clerk sends a signed `user.deleted` event to `/api/v1/webhooks/clerk`.
5. The raw request is verified before any event data is trusted.
6. One database transaction records the webhook delivery and upserts a durable deletion request.
7. The single cron cycle processes deletion work before normal scan and CRM jobs.
8. The worker deletes the Stripe customer when present, then deletes local tenant data in a fenced transaction.
9. The retained audit contains keyed digests and aggregate row counts, never the Clerk user ID, email, name, Stripe customer ID, or provider error body.

The deletion intake and first-user provisioning path take the same PostgreSQL advisory lock derived from the keyed user digest. A pending or completed tombstone prevents lazy authentication provisioning from recreating a deleted account.

## Hard activation switch

```text
ACCOUNT_DELETION_ENABLED=false
CLERK_SECRET_KEY=<production Clerk secret>
CLERK_WEBHOOK_SIGNING_SECRET=<Clerk endpoint signing secret>
DELETION_AUDIT_SECRET=<long random HMAC key held for the audit retention period>
STRIPE_SECRET_KEY=<matching Stripe mode>
STRIPE_LIVEMODE=<explicit true in production, false in preview tests>
CRON_SECRET=<long random deployment secret>
OPS_SECRET=<separate long random operations secret>
DURABLE_WORKER_ENABLED=false
```

Both `DATABASE_URL` and `DIRECT_URL` sessions must report `SHOW TimeZone` as
`UTC`, `Etc/UTC`, or `GMT`. The migration rejects a non-UTC session and readiness
stays degraded because lease and scheduling columns currently use PostgreSQL
timestamps without a time-zone type.

`ACCOUNT_DELETION_ENABLED` is a dedicated destructive-operation switch and defaults to false. While it is false:

- self-service deletion reports unavailable without claiming deletion;
- the Clerk intake route returns `503` before reading event data; and
- the deletion worker refuses to claim requests.

Self-service identity deletion also refuses to start unless the Stripe secret is
present and matches the explicit `STRIPE_LIVEMODE`. This applies even when new
checkout is disabled because an existing tenant may still have a paid Stripe
customer that must be cancelled during deletion.

Self-service also requires `DURABLE_WORKER_ENABLED=true` and a configured
`CRON_SECRET`; it will not delete the identity when the cleanup lane cannot run.
Signed Clerk intake remains independently available so a genuine provider-side
deletion is durably recorded even during a worker incident.

Do not reuse `CRON_SECRET`, `OPS_SECRET`, the Clerk signing secret, or the audit HMAC key. Do not rotate `DELETION_AUDIT_SECRET` without a documented tombstone migration; changing it makes historical digests unrecognizable.

## Signed webhook contract

Configure the Clerk endpoint as:

```text
https://<production-host>/api/v1/webhooks/clerk
```

Subscribe to `user.deleted`. The route requires the provider delivery ID, verifies the untouched request through Clerk's webhook verifier, ignores unrelated signed events, and persists an accepted deletion before returning success. Replays of the same delivery ID return success without creating a second request.

The endpoint is exempt from Clerk session middleware only at its exact path. Its signature is the authentication boundary; a suffix path remains protected.

## Deletion state machine

`AccountDeletionRequest` moves through:

```text
AWAITING_IDENTITY_DELETE -> PENDING -> RUNNING -> COMPLETED
                                      -> RETRY_WAIT -> RUNNING
                                      -> DEAD
```

- Self-service deletion writes the awaiting state before the Clerk API call. A confirmed deletion or signed Clerk event promotes it. Any Clerk client exception is treated as ambiguous and keeps billing frozen until a signed event or reviewed operator reconciliation resolves it; the application never automatically erases the freeze.
- Identity deletion is refused while any `CheckoutIntent` remains `PENDING`. Because checkout creation and deletion preparation share the same subject lock, an already-issued hosted payment URL cannot race identity deletion and charge a deleted account; the user must first reach a webhook-verified terminal checkout state.
- Checkout creation, billing portal creation, signed deletion intake, Stripe billing mutations, and final local purge share a keyed subject advisory lock.
- Claims use `FOR UPDATE SKIP LOCKED`, a five-minute lease token, database persistence, and a default batch of two.
- Stripe calls have an eight-second timeout and SDK retries are disabled because the durable request owns bounded retry policy.
- Stripe customer deletion is safe to replay; an already-missing customer is treated as complete.
- Stripe configuration, authentication, permission, rate-limit, and connection failures become stable error codes rather than stored provider bodies.
- Retries use bounded exponential backoff and stop at `maxAttempts`.
- Local purge verifies the lease fence again inside the deletion transaction.
- Before purging, the worker re-reads the live billing binding under the subject lock. A late customer binding causes a fenced `BILLING_BINDING_CHANGED` retry without consuming the replacement cleanup attempt or deleting local data.
- User-owned rows are removed through database cascades; pre-delete counts are written to `AccountDeletionAudit`.
- The request then scrubs its local user, Stripe customer, and Stripe subscription identifiers.
- A keyed Stripe-customer tombstone lets late Stripe events terminate successfully after the billing row is gone, instead of retrying forever or recreating account state.

Deleting a Stripe customer also cancels that customer's active subscriptions. The preview proof must still replay the resulting signed subscription event and confirm the tombstone path before production activation.

## Operational endpoints

| Endpoint | Authentication | Contract |
| --- | --- | --- |
| `/api/v1/health/live` | Public | Process liveness only; no database or secret detail |
| `/api/v1/health/ready` | Exact `OPS_SECRET` bearer | `200` only when workers and lifecycle are enabled/configured and durable failure counts are zero |
| `/api/v1/internal/dead-letters` | Exact `OPS_SECRET` bearer | Aggregate counts and check time only; no tenant payloads |
| `/api/v1/cron/jobs` | Exact `CRON_SECRET` bearer | One bounded deletion-plus-job worker cycle |

Bearer checks distinguish missing configuration from a wrong credential and use constant-time comparison for equal-length values. The cron records start, terminal success, and a stable failure code. Readiness returns `503` for a recorded cycle failure, a missing or older-than-three-minute successful heartbeat, work or schedules delayed more than five minutes, an awaiting identity outcome older than five minutes, dead jobs, stale leases, dead deletions, stale deletion leases, failed Stripe inbox entries, Stripe processing older than its ten-minute lease, disabled workers, or incomplete lifecycle/billing configuration. Each healthy cycle also deletes at most 100 successfully processed Stripe inbox rows older than 90 days; failed and in-flight rows are retained.

Alerts must be configured outside the application for every nonzero dead/stale/failed count. The JSON endpoint is visibility, not an alerting system by itself.

## Product-truth boundary

Phase 5 removes synthetic business signals from mounted product surfaces. Empty states remain empty, unavailable integrations say unavailable, and actions report only persisted outcomes. Visual-only animation randomness is allowed; fabricated leads, engagement, revenue, pipeline value, customer testimonials, delivery state, API credentials, and automation state are not.

Application logs must use stable outcome codes and operational identifiers only where necessary. Do not log emails, content, webhook URLs, user IDs, lead IDs, raw provider errors, verified webhook bodies, or deletion subjects.

## Production activation gate

Do not set `ACCOUNT_DELETION_ENABLED=true` until every item passes:

1. Restore-test a full production backup and record recovery time.
2. Confirm the direct migration connection and apply all migrations in a preview clone with zero Prisma drift.
3. Deploy with both worker switches false.
4. Create the exact Clerk webhook endpoint with the production signing secret.
5. Send a real signed non-deletion event and confirm it is ignored without a request row.
6. Send and replay a real signed `user.deleted` event and prove one deletion request.
7. Delete a Stripe test customer with an active subscription and replay the emitted signed Stripe events.
8. Prove a Stripe outage moves the request to retry and the final attempt to `DEAD` without losing identifiers needed for repair.
9. Prove two concurrent workers claim a deletion once and a stale lease cannot purge or overwrite a new owner.
10. Prove local tenant rows cascade, the audit counts match, the request identifiers are scrubbed, and database/log output contains no deletion PII.
11. Prove a later authenticated request cannot recreate a pending or completed subject.
12. Connect readiness and dead-letter counts to a paging destination with an accountable operator.
13. Enable both switches in preview, observe a complete lifecycle rehearsal, then require explicit production approval.

## Recovery and operator actions

- `RETRY_WAIT`: correct the stable failure class and let the bounded worker retry.
- `DEAD`: leave the tombstone/request intact, investigate through provider dashboards and aggregate operational evidence, then use a reviewed forward repair. Never reset attempts or delete audit rows ad hoc.
- Stale lease: verify no long-running provider call is still active; the next worker may reclaim only after expiry.
- Bad deployment: turn off `ACCOUNT_DELETION_ENABLED` first, then `DURABLE_WORKER_ENABLED`. This stops new claims but does not reverse an already accepted Clerk deletion or completed Stripe deletion.
- Audit-key exposure: disable deletion, preserve the database and logs, rotate the key through a planned digest-migration procedure, and treat historical tombstones as security-sensitive.

Database migrations are forward-only. Application rollback is allowed only while its schema remains compatible; never use `prisma migrate reset`, `db push`, or manual table deletion in production.

## Remaining external proof

Local unit, type, lint, build, clean-migration, and PostgreSQL integration results belong in the implementation handoff. They do not replace:

- a restorable production backup;
- a working production `DIRECT_URL`;
- a deployed signed Clerk replay;
- a deployed signed Stripe deletion replay;
- confirmation that Vercel registered the minute cron on the intended plan;
- an external alert destination and operator response test; or
- a controlled production cutover with the destructive switch initially off.

Local PostgreSQL 17 verification includes a clean six-migration deploy, a seeded legacy upgrade, UTC rejection without partial Phase 4-5 DDL, five durable/lifecycle integration scenarios, and both orderings of the deletion-versus-billing advisory-lock race. Stripe cleanup compensation remains best effort: if Stripe cannot expire a newly created Checkout Session or delete a newly created customer, or the Session already completed, provider state must converge through signed webhooks and the deletion worker. The deployed preview gate must exercise that recovery path.

## Dependency advisory gate

The local production dependency audit currently reports three high and one
moderate advisory with no supported automatic fix. The affected path is the
installed Next.js 16.2.12 bundle (`postcss` 8.4.31 and optional `sharp` 0.34.5),
with Clerk listed as affected through its Next.js peer. Do not force unsupported
nested overrides. Re-run `npm audit --omit=dev` and the full verification suite
when a compatible patched Next.js release is available, and record the risk
acceptance if production must launch before then.
