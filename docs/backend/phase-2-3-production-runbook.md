# Backend production runbook: phases 2 and 3

Status: local implementation and verification complete; production deployment and database cutover remain blocked by the Phase 1 backup gate and live Stripe replay.

## Scope

Phase 2 establishes identity and tenant authorization:

- Clerk is the only credential and session authority.
- Customer, Stripe, and cron requests use separate explicit principals.
- Proxy performs optimistic routing only; every action and handler reauthorizes.
- Browser responses use allowlisted DTOs instead of raw Prisma records.
- Every customer-owned query and mutation includes the authenticated user ID.
- CRM webhook destinations are HTTPS-only, reject credentials and local/private targets, verify every DNS answer, pin the request to a verified public IP, disable redirects, and use a short timeout.

Phase 3 establishes billing truth:

- `BillingSubscription` is the canonical subscription record.
- `CheckoutIntent` records what the server expected before redirecting to Stripe.
- `StripeWebhookEvent` records delivery and processing state.
- `CreditLedgerEntry` makes economic grants idempotent by their source object.
- plan and potion fulfillment resolve from a server-owned catalog, never numeric client or webhook metadata;
- paid capabilities are checked on the server at the use-case boundary.

## Launch catalog

The initial production catalog is deliberately narrow:

| Plan | Enabled | Price | Scan allocation |
| --- | --- | ---: | ---: |
| FREE | Yes | $0 | No paid allocation |
| BETA | Yes | $14.99/month | 50 |
| PRO | No | Not sellable | Not provisioned |
| AGENCY | No | Not sellable | Not provisioned |

PRO and AGENCY must fail closed until their public price, Stripe Price ID, limits, renewal behavior, and server enforcement agree. RPG class names are display aliases and must never be stored as billing authority.

## Production environment gate

Required before enabling checkout:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BETA`
- `STRIPE_LIVEMODE=true`
- `NEXTAUTH_URL`
- Clerk production keys
- `DATABASE_URL`
- `DIRECT_URL`
- `CRON_SECRET`

`NEXTAUTH_URL` must be HTTPS in production. Keep both checkout switches false
during cutover. After the signed sandbox replay, ledger audit, and
production-mode verification pass, enable only
`SUBSCRIPTION_CHECKOUT_ENABLED=true` for BETA. Keep
`POTION_CHECKOUT_ENABLED=false` until refund and dispute reversal events are
implemented, tested, and monitored.

In Stripe Checkout settings, enable the one-subscription redirect for customers
who already have an active subscription. The application also checks Stripe's
live subscription list before creating a new Checkout session; the dashboard
setting is defense in depth, not a replacement for the server check.

`STRIPE_PRICE_PRO` and `STRIPE_PRICE_AGENCY` do not enable those plans by themselves. Code and catalog review are required.

The Stripe endpoint must be exactly:

`https://hypequest-engine.vercel.app/api/v1/webhooks/stripe`

Subscribe only to the event types processed by the application. At minimum, the final handler and reconciliation tests must cover Checkout completion, subscription creation/update/deletion, and any invoice event used for monthly allocation.

The 50-scan allocation is granted only for a positive, paid `invoice.paid` with
`billing_reason` equal to `subscription_create` or `subscription_cycle`, a line
matching the enabled Stripe Price, and a verified subscription/customer/user
relationship. The ledger key is `STRIPE_INVOICE` plus the Stripe invoice ID.
Repeated event IDs and different event IDs for the same invoice must not grant
twice. Webhook rows stuck in `PROCESSING` are reclaimable after a ten-minute
lease; the attempt number fences a stale worker from overwriting the reclaimer.
A duplicate already marked `PROCESSED` returns 2xx. A duplicate whose lease is
still actively `PROCESSING` returns 503 with `Retry-After`, so Stripe continues
delivery after a crashed worker. Legacy inbox rows are migrated as `PROCESSED`
and are never replayed as unknown events.

## Database cutover

Do not run these migrations in production until the Phase 1 runbook's full-backup and writable-traffic pause requirements pass.

After the three baseline/no-op migrations are marked applied, production should execute:

1. `20260729223000_reconcile_production_schema`
2. `20260730013000_identity_billing_foundation`

The Phase 2-3 migration:

- removes the unsafe legacy password field;
- migrates legacy Stripe customer links into `BillingSubscription` as `FREE/inactive` pending Stripe reconciliation;
- removes competing plan, status, and tier fields from `User`;
- creates subscription, checkout, webhook, and ledger tables;
- enables RLS and removes browser Data API access;
- revokes automatic future public-schema grants for `anon` and `authenticated`.

## Required proof before accepting money

- Fresh PostgreSQL 17 applies all migrations with zero Prisma drift.
- Existing-database adoption preserves tenant row counts and legacy Stripe customer IDs.
- An unauthenticated caller cannot invoke any customer action or API.
- Tenant A cannot read, claim, dismiss, export, or delete Tenant B data.
- Stripe and cron can reach their exact public routes, but invalid signature/secret requests fail.
- Duplicate Stripe event delivery changes state once.
- Different event IDs for the same Checkout, invoice, or payment change economic state once.
- An unpaid or mismatched potion session grants zero credits.
- An unknown Stripe customer or subscription remains retryable and alerts operations.
- Subscription events delivered out of order converge to current Stripe state.
- Checkout failures never create local or server-side success signals.
- FREE users cannot invoke BETA-only scans, AI generation, or CRM export by calling actions directly.
- BETA renewal allocation occurs once per paid invoice before the product claims monthly refill.
- Refund/dispute reversal is implemented before refundable top-ups are sold broadly.

## Local verification completed

Completed on PostgreSQL 17 without contacting production:

- 28 test files and 163 tests passed; the three PostgreSQL integration cases are
  skipped in the ordinary suite and passed separately against PostgreSQL 17.
- ESLint, TypeScript, Prisma validation, and the Next.js production build passed.
- A clean database applied all five migrations with zero Prisma drift.
- An existing-database adoption rehearsal preserved the four seeded tenant rows and the legacy Stripe customer link, then reported zero drift.
- All eight internal tables had RLS enabled and `anon`/`authenticated` retained zero table grants.
- New-user scan-credit defaults were verified as zero; existing legacy balances were not rewritten.

Still required externally: a restorable production backup, a working `DIRECT_URL`, signed Stripe sandbox event replay against a deployed preview, legacy customer reconciliation, and the controlled production cutover.

## Rollout order

1. Obtain and restore-test the full database backup.
2. Configure `DIRECT_URL` and Stripe production variables.
3. Pause cron, webhooks, and user writes.
4. Run the Phase 1 and Phase 2-3 migrations.
5. Reconcile every legacy Stripe customer against current Stripe state.
6. Deploy the application with checkout still disabled.
7. Replay signed sandbox events and verify database state.
8. Set `STRIPE_LIVEMODE=true`, then enable only BETA subscription checkout.
9. Monitor webhook failures, duplicate events, checkout abandonment, and credit-ledger drift.
10. Resume cron and customer writes.

## Known follow-on work

- Durable queue/outbox processing for Stripe and CRM delivery.
- A controlled egress worker remains preferable to making arbitrary CRM calls inside a web request.
- Automated Stripe reconciliation and dead-letter alerts.
- Refund/dispute ledger reversal.
- Clerk account-deletion webhook and a proven data-purge workflow.
- Replace provider-owned Clerk IDs as database primary keys with immutable internal user IDs.
- Replace synthetic guild/analytics fallback data and add an explicit public-profile/leaderboard consent model.
- Reconcile scan debit/refund crash gaps and replace the global `take: 50` scheduler with fair, durable tenant jobs.
- Revisit potion quantities before enabling sales; the current 1,000–6,000 top-ups share the same wallet as a 50-scan monthly plan.
- Clerk organization model if Agency becomes multi-seat.
- Least-privilege PostgreSQL runtime role; migration administration must remain separate.
