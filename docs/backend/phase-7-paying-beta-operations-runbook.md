# Backend production runbook: Phase 7 paying-beta operations

Status: core recovery controls are implemented and locally verified. Phase 7 is not production-certified until the external preview gates below pass. Durable email alerts and a durable Stripe billing-operation state machine remain launch blockers for unattended scale.

## Architecture contract

Phase 7 makes accepted work recoverable by the buyer and safer for the operator:

1. `GET /api/v1/scans/:id` gives the authenticated tenant a terminal source of truth for queued scans.
2. `GET /api/v1/crm-deliveries/:id` returns tenant-scoped status, attempt counts, timestamps, and only the HTTP status class. It never returns the destination, payload, or raw error.
3. `POST /api/v1/crm-deliveries/:id` retries only a dead delivery, only for a currently entitled tenant, and only when the configured normalized destination still matches the accepted fingerprint.
4. A CRM retry atomically resets the existing dead job and delivery. It does not create a second delivery identity or change the stable external idempotency key.
5. Invoice credit allocation reuses the webhook's existing database transaction, removing the nested transaction and second-connection requirement while the deletion/billing lock is held.
6. Readiness now includes strong, distinct worker and operations bearer secrets.

## CRM recovery procedure

- `QUEUED`: let the worker retry; do not send a second manual payload.
- `DELIVERED`: no retry is allowed.
- `DEAD`: correct the destination problem, but retry is permitted only if its normalized fingerprint is unchanged. If the URL changed, accept a new explicitly reviewed delivery instead of replaying an old payload to a new system.
- A retry keeps the same delivery ID and therefore the same `Idempotency-Key`. Customer endpoints must deduplicate that key because at-least-once delivery cannot prove whether a response was lost after acceptance.

## Production activation gate

1. Complete every Phase 4–6 migration and PostgreSQL rehearsal on a restored preview clone.
2. Configure strong, distinct `CRON_SECRET`, `OPS_SECRET`, `RATE_LIMIT_KEY_SECRET`, Clerk signing, Stripe signing, and deletion audit values.
3. Prove one scan from acceptance through terminal status in the mounted product; no timer animation may claim completion.
4. Force CRM timeout, 4xx, 5xx, and lost-response cases against a controlled endpoint. Reconcile attempt state and idempotency headers.
5. Dead-letter one CRM delivery, repair the controlled endpoint, invoke the authenticated retry, and prove exactly one durable job is requeued.
6. Load-test Stripe webhook reconciliation through the production-like pooler and prove no nested-connection starvation.
7. Replace remaining Stripe network-inside-lock checkout/portal flows with a durable prepare/external/finalize operation before high-concurrency launch.
8. Connect worker, provider, CRM, Redis, Stripe inbox, and deletion failures to an external alert destination with an accountable operator.
9. Add durable, explicit-consent customer notifications before promising email alerts.
10. Restore-test the backup, record recovery time, deploy with all activation switches off, then enable only in preview and observe a full operating window.

## Honest release verdict

The backend can support a controlled, closely monitored beta after the preview proofs. It is not a 100/100 unattended production system yet. The remaining top risks are external provider proof, Stripe network calls that still span advisory-lock transactions in checkout/portal paths, no durable customer email delivery, no external paging proof, unresolved upstream dependency advisories, and no measured pool/load envelope.

## Local verification record

- Two concurrent real-database CRM retry requests produced one success and one non-retryable result, retained one delivery, retained one durable job, and reset that job to pending with zero attempts.
- A forced rollback around invoice allocation removed the ledger row and restored both balance and capacity, proving allocation no longer commits through an independent nested transaction.
- All 13 real-PostgreSQL Phase 4–7 integration/race scenarios passed on PostgreSQL 17.10 UTC.
- The full local unit/contract suite, lint, production build with TypeScript, and Prisma validation passed.
- `npm audit --omit=dev` still reports three high and one moderate upstream advisories in the installed Next.js dependency path with no supported fix. Do not force an unsupported override; re-test when a compatible patched release is published.
