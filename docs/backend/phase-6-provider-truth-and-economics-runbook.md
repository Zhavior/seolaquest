# Backend production runbook: Phase 6 provider truth and economic safety

Status: implemented locally. Provider, worker, payment, and deletion activation remain controlled by their existing switches. No production provider, database, Stripe, Clerk, Redis, or deployment state was changed.

## Architecture contract

Phase 6 makes a paid scan and AI reply auditable instead of merely accepted:

1. Adding a keyword creates a disabled schedule. It never silently opts a tenant into recurring credit consumption.
2. Existing schedules are disabled by the forward migration because the old schema has no trustworthy record of customer opt-in.
3. A worker claims one durable job immediately before starting it. Work left outside the wall-time budget remains unclaimed and consumes no attempt.
4. Each provider/keyword request writes a `ProviderScanAttempt` with a stable outcome, timing, result counts, HTTP status class, and rate-limit reset when available.
5. Reddit and X payloads pass runtime schemas and timestamp/canonical URL checks before becoming leads.
6. `LeadMatch` preserves which scan, provider attempt, and keyword produced a stored lead; `Lead.observedAt` preserves provider observation time.
7. The authenticated scan-status endpoint scopes by tenant and returns aggregate provider truth without provider bodies or raw internal errors.
8. AI replies require a distributed per-tenant daily allowance before OpenAI is called. The tenant key is HMAC-digested, response shape and length are validated, input is bounded, and output is capped at 180 tokens.

## Required environment

```text
UPSTASH_REDIS_REST_URL=<production Redis REST endpoint>
UPSTASH_REDIS_REST_TOKEN=<production Redis REST token>
RATE_LIMIT_KEY_SECRET=<at least 32 random bytes, distinct from all other secrets>
OPENAI_API_KEY=<production project key>
OPENAI_REPLY_MODEL=gpt-4o-mini
CRON_SECRET=<at least 32 random bytes>
OPS_SECRET=<different value, at least 32 random bytes>
```

AI replies fail closed when any limiter setting is missing, weak, or unreachable. `CRON_SECRET` and `OPS_SECRET` must both be at least 32 bytes and distinct; readiness reports machine authentication as misconfigured otherwise.

## Provider truth contract

Provider outcomes are stable operational classes: success with results, success with zero results, malformed response, rate limited, or unavailable. An HTTP 200 is not sufficient by itself. A response must pass its provider schema and record validation. Provider response bodies and tokens are never persisted in the attempt ledger or returned through the public API.

The provider attempt tables live in the exposed `public` schema for Prisma compatibility, but row-level security is enabled and direct `anon`/`authenticated` table privileges are revoked. Server-side Prisma remains the access boundary. This follows the current Supabase guidance that grants and RLS are separate layers and should be applied together for exposed objects: [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api).

## Economic contract

- The Beta invoice allocation remains 50 scan credits.
- Recurring scan automation is disabled until the product has an explicit, persisted opt-in control.
- The dormant recurrence interval is 24 hours rather than 15 minutes, preserving manual headroom if it is enabled later.
- AI replies are limited to 20 per tenant in a sliding 24-hour window.
- Limiter failure blocks the paid provider call; it does not degrade to unmetered use.
- OpenAI defaults to the bounded `gpt-4o-mini` path and can be changed only through explicit deployment configuration.

## Production proof gate

Do not describe provider-backed scanning as production-certified until all items pass in a deployed preview:

1. Apply the forward migration to a restored production-like database and confirm existing schedules are disabled.
2. Prove direct client roles cannot select, insert, update, or delete provider attempt/provenance rows.
3. Run controlled Reddit zero-result, malformed, timeout, and rate-limit cases and inspect the stored outcome only.
4. Run the same proof for X when its token is configured.
5. Queue a scan, poll its tenant-scoped status to terminal state, and reconcile returned counts to attempts, lead matches, and credit ledger entries.
6. Exhaust the AI allowance and prove no twenty-first OpenAI request occurs.
7. Break Redis connectivity and prove AI fails closed with no OpenAI request.
8. Observe provider latency and error rate through a full preview window before approving production worker activation.

## Residual limits

This phase does not prove provider terms, production credentials, live rate-limit behavior, or lead quality. Those require provider-owned staging or production evidence. It also does not make recurring scans buyer-operable; automation remains off until an explicit consent and budget control exists.

## Local verification record

- Full local gate: 56 test files passed, 335 tests passed, with 3 files/13 tests intentionally skipped because they require an explicit disposable PostgreSQL environment.
- Production build compiled, completed its TypeScript pass, and generated all static pages.
- Full lint and Prisma schema validation passed.
- PostgreSQL 17.10 UTC applied all seven migrations with seven finished records and zero rollbacks.
- Migration adoption proved schedule opt-out, `observedAt` backfill, RLS enabled, and no direct `anon`/`authenticated` table access.
- Thirteen real-PostgreSQL integration/race scenarios passed across durable operations, deletion/billing serialization, CRM retry, and credit/webhook invariants.
