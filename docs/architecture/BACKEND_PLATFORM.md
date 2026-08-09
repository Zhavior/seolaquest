# Backend Platform Architecture

**Scope:** the cross-cutting backend platform — request lifecycle, authentication, rate limiting,
error taxonomy, logging, async work, and the security conventions that hold them together.

**Not in scope:** the event core, Aurora decision engine and Gamify OS domain design, which are
covered in [`AURORA_GAMIFY_ARCHITECTURE.md`](./AURORA_GAMIFY_ARCHITECTURE.md). This document
describes the platform those domains run *on*.

**Stack:** Next.js 16 (App Router) · Prisma 5 / PostgreSQL (Supabase) · Clerk · Stripe · Upstash
Redis · pino · zod · Vercel.

---

## 1. The one thing to read first

This repo is on **Next.js 16**, where the `middleware.ts` file convention was deprecated and
**renamed to `proxy.ts`**. The Clerk auth gate is at `proxy.ts` in the repo root.

Searching for `middleware.ts` returns nothing. That is not evidence of missing auth, and adding a
`middleware.ts` produces a file Next 16 ignores. `AGENTS.md` states that this Next is not the one
in your training data — read `node_modules/next/dist/docs/` before using an API from memory.

---

## 2. Request lifecycle

```
                 ┌──────────────────────────────────────────────┐
   HTTP request  │  proxy.ts        (Next 16 "middleware")       │
   ──────────────▶  clerkMiddleware + createRouteMatcher         │
                 │  auth.protect() unless in PUBLIC_ROUTE_...    │
                 └───────────────────────┬──────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
        ┌───────────▼───────────┐                 ┌───────────▼───────────┐
        │  Route Handler        │                 │  Server Action        │
        │  withApiHandler       │                 │  withServerAction     │
        └───────────┬───────────┘                 └───────────┬───────────┘
                    │  ip pre-limit → auth() → per-identity limit
                    │  loggerContext.run({requestId,userId,path,ip})
                    │  try { handler } catch { typed → response }
                    └────────────────────┬────────────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │  src/modules/<domain>/        │
                         │  application services         │
                         └───────────────┬───────────────┘
                                         │
                                  Prisma / Postgres
```

### 2.1 `proxy.ts` — the outer gate

`clerkMiddleware` calls `auth.protect()` for every request **not** matching
`PUBLIC_ROUTE_PATTERNS`. The `config.matcher` has an unconditional `'/(api|trpc)(.*)'` entry, so
no API path can escape via the static-file exclusion.

`PUBLIC_ROUTE_PATTERNS` contains two kinds of entry:

| Kind | Examples | Note |
|---|---|---|
| Marketing / auth pages | `/`, `/pricing`, `/blog`, `/blog/(.*)`, `/status` | `(.*)` is a **prefix** match in Clerk, not a subtree match — use `'/x'` + `'/x/(.*)'` |
| Machine endpoints | `/api/v1/cron/jobs`, `/api/v1/health/live`, `/api/v1/health/ready`, `/api/v1/internal/dead-letters`, `/api/v1/webhooks/clerk`, `/api/v1/webhooks/stripe` | Exact strings. These authenticate **themselves** — see §3.2 |

`/sign-in(.*)` and `/sign-up(.*)` must keep the broad prefix form: both are mounted in optional
catch-all segments and Clerk's `useEnforceCatchAllRoute` probes a generated child path at runtime,
throwing a configuration error if that child is protected.

`/dev(.*)` is public **only outside production**, and the pages themselves 404 in production.

### 2.2 `withApiHandler` — the API chokepoint

`src/modules/core/infrastructure/api-handler.ts`. Every Route Handler should be wrapped. It
provides, in order:

1. **Client IP resolution** from a trusted hop of `x-forwarded-for` (see §4.1).
2. **Coarse IP pre-limit** — runs *before* Clerk `auth()` so a flood does not buy an
   identity-provider round trip per request.
3. **Identity resolution** — `auth()` in a `try/catch`, tolerating routes that are not Clerk-scoped.
4. **Per-identity limit** keyed on `userId ?? ip`.
5. **`loggerContext.run`** — AsyncLocalStorage store carrying `requestId`, `userId`, `path`, `ip`
   onto every log line for the rest of the request.
6. **Total error mapping** — see §5.

> **A wrapped route has no visible `try/catch`, no visible limiter and often no visible zod call.**
> Auditing by grepping route files for `try` reports the best-protected routes as unguarded. Judge
> a route by whether it is wrapped. A bare `export async function POST` is the real smell — it
> silently opts out of rate limiting and structured errors.

### 2.3 `withServerAction` — the Server Action analogue

`src/modules/core/infrastructure/server-action.ts`. Server Actions are a *larger* mutation surface
than the API routes (a Server Action is a POST endpoint reachable by anyone who can replay its
action id), and they cannot return a `NextResponse` — the return value *is* the response.

Two consequences shape the design:

- **Failures come back as data**, not as throws. An uncaught throw in a Server Action is not a 500;
  React serializes it into an opaque `digest` and renders the nearest error boundary, destroying
  the page the user was on. Overloads (`onError` as a translator function, or `'rethrow'`) let each
  action keep its existing return contract instead of forcing a rewrite of every call site.
- **`unstable_rethrow` must be the first statement of the catch.** `redirect()`,
  `permanentRedirect()`, `notFound()` and the dynamic/PPR bailouts are implemented as *thrown
  errors that Next unwinds itself*. A catch that classifies them as failures silently breaks every
  navigation in the app, and unit tests usually do not catch it.

Authorization is deliberately **not** hoisted into the wrapper: several actions answer a signed-out
caller with a specific non-throwing result the UI renders, and a generic 401 would replace those
messages.

---

## 3. Authentication and authorization

### 3.1 Human callers

Three independent layers, defence in depth:

1. `proxy.ts` `auth.protect()` — the outer gate.
2. Per-route `getCurrentUser()` (`lib/auth.ts`) — provisions the local `User` row on first sight,
   serialized by a per-email advisory lock.
3. Per-service re-authorization — e.g. `KeywordService.requireUserId()` throws `UnauthorizedError`
   independently, and every query is scoped by `userId`.

Shared-resource endpoints add a **fourth** layer: an explicit env allowlist, because public sign-up
means "signed in" is not an authorization statement. See §6.

**`User.id` *is* the Clerk user id.** There is no separate `clerkId` column and no mapping table:
`createUserInTransaction` inserts `{ id: userId }` straight from `auth()` (`lib/auth.ts:208`, the
only place production code creates a `User`), every read is `findUnique({ where: { id: userId } })`,
and `reconcileVerifiedEmailUser` *rewrites* a legacy row's `id` to the Clerk id rather than
cross-referencing it. So `getCurrentUser().id`, `auth().userId`, and the ids in
`X_POST_ADMIN_USER_IDS` / `BLOG_ADMIN_USER_IDS` / `AURORA_ADMIN_USER_IDS` are all the same string.

This matters because the two look like different things at call sites — a route passing `user.id`
and a Server Action passing `auth().userId` read as two identifiers for one human, which invites a
"fix" that maps between them or unifies them. They are already the same value; a rate-limit tier
charged from both paths shares one bucket. The invariant is load-bearing for every allowlist and
every limiter identifier in this document.

The schema's `@default(uuid())` on `User.id` is the one way it could break: it is never exercised
today because the id is always supplied, but a `user.create` that omits `id` would mint a row the
Clerk session can never find again. Always supply it.

### 3.2 Machine callers

`src/modules/core/security/machineBearer.ts` — `verifyMachineBearer` is timing-safe
(`crypto.timingSafeEqual`) and returns three states:

| Result | Meaning | Response |
|---|---|---|
| `missing_config` | secret absent, or shorter than 32 bytes | `503` |
| not `authorized` | presented bearer did not match | `401` |
| `authorized` | proceed | — |

| Endpoint | Secret | Extra gate |
|---|---|---|
| `/api/v1/cron/jobs` | `CRON_SECRET` | `DURABLE_WORKER_ENABLED === 'true'`, DB clock assertion |
| `/api/v1/health/ready` | `OPS_SECRET` | — |
| `/api/v1/internal/dead-letters` | `OPS_SECRET` | — |
| `/api/v1/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` | `stripe.webhooks.constructEvent` HMAC on the raw body |
| `/api/v1/webhooks/clerk` | `CLERK_WEBHOOK_SIGNING_SECRET` | svix signature verify + `ACCOUNT_DELETION_ENABLED` |
| `/api/v1/health/live` | none, by design | static `{status:'live'}`, no data, no DB |

`OperationalHealthService` additionally asserts these secrets are **distinct and strong**, so
`CRON_SECRET === OPS_SECRET` surfaces as not-ready rather than passing silently.

---

## 4. Rate limiting

`src/modules/core/security/RateLimiter.ts` — Upstash Redis sliding window. Enforced centrally by
`withApiHandler` / `withServerAction`; individual routes add a stricter tier where warranted.

| Tier | Budget | Identifier | Purpose |
|---|---|---|---|
| `ip` | 300 / 1m | client IP | coarse pre-auth flood brake, above the per-identity budget so a NAT'd office is not the first thing to break |
| `unidentified` | 10 / 1m | one shared constant | requests whose IP cannot be established — a trickle, not an allowance |
| `global` | 100 / 1m | `userId ?? ip` | ordinary per-identity budget |
| `auth` | 5 / 1m | userId | credential / session / recovery paths |
| `billing` | 10 / 1m | userId | spend-bearing and sensitive writes |
| `ai` | 20 / 1h | userId | LLM endpoints billing our own key |
| `xPost` | 8 / 24h | userId | writes to the single shared X account; sized against X's per-token 24h cap, not as a personal quota |

### 4.1 Identifier integrity

`x-forwarded-for` is a comma-separated hop trace and **client-supplied values arrive intact at the
left**. Reading it raw lets a caller mint unlimited fresh buckets by varying a prefix, or park
their traffic in a victim's bucket. The resolver therefore:

- selects the hop from the **right** (`TRUSTED_PROXY_HOPS = 0`: Vercel's edge appends the
  terminating peer address last and we run no proxy behind it),
- validates the result parses as a real IPv4/IPv6 address,
- routes anything unresolvable to the tight `unidentified` tier,
- has **no** walk-left-until-something-parses fallback, which would itself be a spoofing primitive,
- ignores `x-real-ip` entirely — on Vercel it adds nothing, and elsewhere it is just another header
  the caller controls.

### 4.2 Key privacy and the one deliberate degradation

Identifiers are HMAC'd before they reach Redis (`analytics: true` records keys, so literals would
turn the limiter's telemetry into a log of who called from where). Hashing needs
`RATE_LIMIT_KEY_SECRET`.

- **Per-endpoint tiers** (`auth`, `billing`, `xPost`, `ai`) with no secret → `key: null` → **fail
  closed**.
- **API-wide tiers** (`global`, `ip`) with no secret → a per-process **ephemeral** key. Still
  enforced, still never literal; only bucket *continuity* degrades (each instance partitions its
  own buckets). Failing closed here would take the entire API offline on one missing env var.
  Logged once per process at error level, never silently.

`enforce()` also throws in production when the limiter cannot be consulted at all — an unanswerable
limiter is not "allowed". 429s carry RFC 9110 `Retry-After` in delta-seconds.

---

## 5. Errors and logging

### 5.1 Error taxonomy

`src/modules/core/infrastructure/errors.ts`. `AppError(message, statusCode, code, details)` with
subclasses: `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError`
404, `ConflictError` 409, `DomainError` 422, `RateLimitError` 429.

Wire shape is uniform: `{ error, code, details? }`.

`sanitizeDetails()` is the trust boundary. `details` is `unknown` and is serialized to the client,
so it is projected — never passed through — at render time: depth/entry/string caps, `Error`
instances dropped, and an `UNSAFE_DETAIL_KEYS` denylist stripping `stack`, `cause`,
`clientVersion`, `meta`, `errno`, `syscall`, `query`, `sql`, `parameters`, `modelName`, `target`.
Zod issues are reduced to `{path, code, message}`, and `invalid_enum_value` messages are replaced
wholesale because Zod interpolates the **rejected input** into the default message.

5xx bodies never carry the internal message — only `{error: 'Internal Server Error', code}`.

### 5.2 Logging

`src/modules/core/infrastructure/logger.ts` — pino, with:

- `LOG_REDACT_PATHS` censoring `email`, `userId`, `clerkId`, `description`, `feedback`,
  `authorization`, `token`, `apiKey`, `secret`, `password` (and `*.`-prefixed variants),
- `serializeLogError` reducing errors to `{type, code?, statusCode?}` — **no stack, no message**,
- a `Proxy` that merges the `loggerContext` ALS store into every call, so `requestId`/`userId`/
  `path`/`ip` ride along without being passed manually,
- `pino-pretty` outside production only.

House convention for a log line: an `event` (snake_case), an `outcomeCode` (SCREAMING_SNAKE), and
the error under the `err` key. An eslint rule bans `console.*` in `app/`, `lib/` and `src/`
(exempting tests and client error boundaries), because console output skips both redaction and the
request context.

---

## 6. Feature gating and allowlists

Shared-resource and destructive surfaces are gated by an **explicit user allowlist plus a
production switch**, both failing closed:

| Surface | Allowlist | Switch |
|---|---|---|
| X posting | `X_POST_ADMIN_USER_IDS` | `X_POSTING_ENABLED` |
| Blog publishing | `BLOG_ADMIN_USER_IDS` | `BLOG_PUBLISHING_ENABLED` |
| Aurora admin | `AURORA_ADMIN_USER_IDS` | — |
| Account deletion | — | `ACCOUNT_DELETION_ENABLED` |
| Durable worker | — | `DURABLE_WORKER_ENABLED` |
| Checkout | — | `SUBSCRIPTION_CHECKOUT_ENABLED`, `POTION_CHECKOUT_ENABLED`, `ENABLE_BETA_CHECKOUT` |

An empty allowlist means **nobody**, never "no restriction". Sign-up is public, so being signed in
is not sufficient authorization for a resource the caller does not own.

---

## 7. Asynchronous work

There are **two independent queues**. Confusing them is a common error.

| | Durable job queue | Domain event outbox |
|---|---|---|
| Table | `DurableJob` | `DomainEventLog` (+ `DomainEventConsumerReceipt`) |
| Written by | `ScanSchedulerService`, `CrmDeliveryService` | `EventStore.writeOutbox`, inside the domain transaction |
| Drained by | `JobWorkerService.runCycle()` | `EventProcessor.processPendingBatch()` |
| Concurrency | `claimBatch` lease + worker id | `FOR UPDATE SKIP LOCKED`, 5-minute lease |
| Kinds / types | `TENANT_SCAN`, `CRM_EXPORT` | `opportunity.*`, `lead.converted`, `aurora.*` |

Both are driven by the single cron: `vercel.json` → `/api/v1/cron/jobs`, `* * * * *`,
`maxDuration = 60`. The two are failure-isolated from each other.

### 7.1 The outbox ordering invariant

> `EventProcessor.processEvent` marks an event `PROCESSED` when `getConsumers(type)` returns empty
> — reasoning that an event nobody listens to is done. Therefore **draining against an
> unregistered dispatcher does not fail to process the backlog; it destroys it**, silently, in one
> pass.

`registerAllEventConsumers()` (`src/modules/core/events/registerConsumers.ts`) must be awaited
**before** `EventProcessor` is imported in the cron path. Never reorder. Never add a drain
elsewhere without the same guarantee.

Retry semantics: `claimPendingBatch` increments `attempts` on claim and takes `PENDING` plus
lease-expired `PROCESSING`. Failures below `maxAttempts` get exponential backoff via `availableAt`
(2s base, 15m cap). At `maxAttempts` the row becomes `FAILED`, which is **terminal** — deliberately
excluded from the claim predicate so an operator resetting `attempts` cannot silently resurrect a
dead letter through a path nobody is watching. Requeueing must be explicit and auditable.

Per-consumer idempotency lives in `DomainEventConsumerReceipt` (`@@unique([eventId, consumerKey])`),
so a partially-failed fan-out re-runs only the consumers that did not succeed.

### 7.2 Operational visibility

`OperationalHealthService.snapshot()` backs both `/api/v1/health/ready` and
`/api/v1/internal/dead-letters`. It counts stuck durable jobs, deletion requests, scan schedules,
Stripe webhook events, and outbox depth (terminal `FAILED` rows, plus `PENDING` rows older than the
backlog threshold — work the drain could have claimed and did not).

Outbox counts are **threshold-scored**, not summed per row: one dead letter is a bad payload, not
an outage. Both feed readiness, so a filling outbox turns `/health/ready` 503.

---

## 8. Validation

zod at the boundary, rejecting **before** any Prisma or service call.

`req.json()` throws `SyntaxError` on a malformed body, which is neither `ZodError` nor `AppError`
and therefore renders as a generic 500 — a client error reported as a server fault.
`src/modules/core/infrastructure/safeJson.ts` converts it to a `ValidationError` (400). Use it
rather than a bare `await req.json()`.

Bound every string (`max`) and array (`max` items); unbounded input is a resource-exhaustion
vector. Validate path params as `uuid()` where the model uses uuid ids.

---

## 9. Module layout

```
app/
  api/v1/...         Route Handlers (scan, scans/[id], keywords, blog, crm-deliveries,
                     potions, user/me, mlb, health/*, webhooks/*, cron/jobs, internal/*)
  api/dashboard, api/profile, api/gemini, api/x
  actions/           Server Actions
features/*/actions.ts  Server Actions, per feature
lib/                 auth.ts (getCurrentUser + provisioning), prisma.ts, env.ts, x.ts, aiBlogger.ts
src/modules/
  core/
    infrastructure/  api-handler, server-action, errors, logger, safeJson
    security/        RateLimiter, AiUsageLimiter, machineBearer, idempotency,
                     crmWebhookUrl (SSRF guard), crmWebhookRequest, AuditService
    events/          EventStore, EventProcessor, EventDispatcher, EventFactory,
                     EventRegistry, registerConsumers
    jobs/            JobWorkerService, DurableJobRepository, databaseClock
  aurora/ billing/ leads/ keywords/ users/ lifecycle/ operations/ gamify/
  progression/ onboarding/ analytics/ feedback/ posts/
prisma/schema.prisma   29 models
proxy.ts               Clerk gate (Next 16's middleware)
```

Domain modules follow `application/` (services, orchestration) + `domain/` (pure rules) +
`infrastructure/` where needed. Routes stay thin and delegate.

---

## 10. Conventions checklist

When adding a backend surface:

- [ ] Wrap it — `withApiHandler` for routes, `withServerAction` for actions. Never a bare export.
- [ ] Validate with zod **before** Prisma. Use `safeJson` for bodies. Bound strings and arrays.
- [ ] Throw typed errors (`errors.ts`); do not hand-roll response shapes.
- [ ] Log via pino with `event` + `outcomeCode` + `err`. Never `console.*`. Check
      `LOG_REDACT_PATHS` before logging a field; never log zod issues (they carry rejected input).
- [ ] Pick a rate-limit tier deliberately; spend-bearing means `billing` or stricter.
- [ ] Scope every query by `userId`. Do not rely on `proxy.ts` alone.
- [ ] Unconfigured must mean forbidden. Empty allowlist means nobody.
- [ ] If it redirects, confirm `unstable_rethrow` still runs before any classification.
- [ ] If it emits domain events, write them through `EventStore.writeOutbox` **inside** the
      domain transaction.

### 10.1 Auditing the shadow copies

macOS/cloud-sync clients duplicate files as `Foo 2.tsx`, and `.gitignore` hides them from git
while `--ignore-pattern '**/* 2.*'` hides them from lint. Nothing imports them, so tsc and the
build stay silent too — they are invisible to every gate this document otherwise relies on. They
recur, so this is an audit to repeat, not a one-time cleanup. Classify before deleting: they are
untracked, so `rm` is unrecoverable and a shadow with no original is the *only* copy of that file.

```bash
find . -path ./node_modules -prune -o -path ./.next -prune -o -name "* [0-9].*" -print | while read -r f; do
  orig=$(echo "$f" | sed -E 's/ [0-9]+\././')
  if   [ ! -e "$orig" ];                    then echo "ORPHAN    | $f"
  elif diff -q "$f" "$orig" >/dev/null 2>&1; then echo "IDENTICAL | $f"
  else                                            echo "DRIFTED   | $f"; fi
done | sort
```

The August 2026 sweep found 58: 31 identical, 25 drifted, 2 orphans. Both categories beyond
"identical" matter. `RateLimiter 2.ts` was *drifted*, not byte-identical as this document
previously claimed — 152 lines against the real file's 301, a pre-hardening copy with no `ai`
tier, no `HASHED_TYPES` and no fail-closed branch. A reader who opened it looking for the limiter
would have found a version whose security properties this document describes but which the code
no longer has. The orphans were a stale test importing a `./route` that had since been split into
`live/` and `ready/`, and `CoQuestShell 2.tsx` — the sole surviving copy of the pre-rebrand shell,
superseded by `SEOlaQuestShell.tsx`.

---

## 11. Known open risks

Tracked deliberately rather than silently. Current as of the August 2026 hardening pass.

| Risk | Where | Status |
|---|---|---|
| `aurora.opportunity.evaluated` has a producer but no registered consumer, so `EventProcessor` marks it `PROCESSED` on the zero-consumer branch | events | **Intentional.** The decision is already durable in `AuroraDecision`, which is what the product view reads; the event exists for analytics and future consumers. Revisit only if something needs to react to a verdict. |
| `opportunity.dismissed` has neither producer nor consumer, and `LeadService.dismissLead` is the one lead transition not wrapped in a transaction | `LeadService.ts` | Open — emitting it would require wrapping that update first |
| `LeadStatus.VIEWED` is declared but never written by anything | `prisma/schema.prisma` | Open — dead state |
| Deep-cloned `sanitizeDetails` output is the only thing keeping zod's `received` (the caller's rejected input) out of 4xx bodies | `errors.ts` + every route that passes `details` | Open — convention, not enforced |
| The shipped `AuroraDecision` / `AuroraFeedback` models diverge from the ones `AURORA_GAMIFY_ARCHITECTURE.md` specifies — no FK to `Lead`, no `userId`, no `dimensions`, and uniqueness on `(sourceEventId, …versions)` rather than `opportunityId` | `prisma/schema.prisma` | Open — "decisions for this tenant" cannot be queried without joining through the event payload |
| macOS/cloud-sync shadow copies (`Foo 2.tsx`) reappear in bulk and are invisible to git, lint and tsc via the `* 2.*` / `* [0-9].*` ignore patterns | repo-wide | **Cleared 2026-08-09 (58 files). Recurrence is the risk, not the files** — re-run the audit below whenever the sync client has been active. |
| Backlogged `DomainEventLog` rows replay in one tick on first deploy of the drain | cron | **Checked 2026-08-09 against the Supabase instance in `.env.local`: `DomainEventLog` and `DomainEventConsumerReceipt` are both empty, so there is no backlog to replay.** Consistent rather than surprising — the only two `writeOutbox` producers are `AuroraService:158` and `AuroraFeedbackService:75`, and `AuroraDecision`/`AuroraFeedback` are also empty, so neither has ever run. Re-check against the deploy target if it is a different instance than the one configured locally. |
| `getCurrentUser()` is not memoized: each call is `auth()` + a `findUnique` + two deletion-state queries, so a request that calls it twice pays ~6 round trips | `lib/auth.ts` | Open — cost, not correctness |
| A catch neither logs nor rethrows and returns `error.message` to the client, leaking Prisma internals | `app/app/admin/aurora/actions.ts` | Open — pre-existing, in untracked code, action has no callers |
| `AiUsageLimiter` fails closed in *every* environment, unlike `RateLimiterService`, so a dev box without Upstash now gets 503 on Gemini chat. Chat also shares one 20/day per-tenant AI budget with AI replies. | `app/api/gemini/chat` | Intentional, matches `LeadService` — noted because it is a non-production behaviour change |

### Closed in the August 2026 hardening pass

Outbox never drained and consumers never registered · limiter keyed on raw `x-forwarded-for` ·
`global`/`ip` writing literal identifiers to Redis · Server Actions entirely unlimited · Gemini
chat entirely unlimited · in-memory per-instance limiter on `x/post` · malformed JSON rendering as
500 · `/blog(.*)` prefix over-match · dead-letter endpoint blind to the outbox · `console.*` in
server code (now lint-enforced) · orphaned `complete-onboarding.ts` Server Action deleted ·
missing `DELETION_AUDIT_SECRET` no longer fails open.

Closed after it: `x/post` charging its 8/24h budget before validation, which let 8 malformed
requests lock an admin out for a day — it now charges after the schema passes and immediately
before the billable call, and reads the body through `safeJson` so the parse an over-budget caller
can force is bounded (`app/api/x/post/route.test.ts`, previously untested entirely) ·
`blog/generate` answering schema failures with a second, incompatible 400 shape — both rejection
paths now raise `ValidationError` and render as `{ error, code, details? }` ·
`vitest.setup.ts`'s `next/navigation` mock omitting `unstable_rethrow`, `redirect`,
`permanentRedirect` and `notFound`, which made the redirect hazard unreachable from the default
jsdom environment — the mock now models them against Next 16's digest formats, and
`server-action.jsdom.test.ts` exercises the wrapper through it.

### Aurora went live, August 2026

Aurora was fully wired and completely inert: `EventFactory.create` had two non-test call sites
in the repo, both of them Aurora's *own* outputs, so the pipeline had no input at either end.

**A `Lead` is the opportunity.** There is no `Opportunity` table and `AuroraDecision.opportunityId`
is a bare string with no FK, so the producers set `opportunityId = lead.id`. That needs no
migration and makes `AuroraDecisionReader.findLatestForOpportunity` work as written.

Producers, each emitted inside the transaction that already performs the mutation:

| Event | Seam | Exactly-once hook |
|---|---|---|
| `opportunity.discovered` | `ScanProviderService.persistCompletedAttempt` | A pre-insert read of stored `externalPostId`s. `createMany({skipDuplicates})` returns no ids and the post-insert read deliberately includes re-observed posts (they still need `LeadMatch` rows), so first sighting is established *before* the insert. Without it, Aurora would re-evaluate — and re-bill — every lead on every daily scan. |
| `opportunity.engaged` | `LeadService.claimQuest` | The existing `claimed.count !== 1` guard on `status: 'NEW'`. |
| `lead.converted` | `CrmDeliveryService` delivery completion | The existing `crmExportedAt: null` guard. Conversion is defined as a successful CRM export — the strongest intent the product records, since `LeadStatus` has no `CONVERTED` member. |

The last two matter more than they look: Gamify pays XP on both, so emitting outside the
transaction would let a user do the work and silently earn nothing.

**The classifier is real.** `GeminiSemanticClassifier` calls Gemini with `responseMimeType:
'application/json'` and a response schema, zod-parses the result independently (a schema is an
instruction to the model, not a guarantee), and has an 8s per-attempt budget with exactly one
retry — for transient network errors only. A 4xx is a statement about our request and fails
identically on a second attempt; a timeout is not retried because the budget *is* the budget and
16s on one lead starves the rest of the batch.

It **never throws**. Every failure returns a `failureCode`, which `AuroraService` records as
`FALLBACK`. That is deliberate: a throw would dead-letter the event and re-bill the provider on
every retry, when the deterministic signals are usually good enough to act on.

**`auroraClassify` is a new limiter tier** (300/24h per tenant, hashed). Not the `ai` tier and not
`AiUsageLimiter` — both of those are the human's own budget for chat and AI replies, and Aurora
spends without the user asking for anything. It is sized as a blast radius, not a cost control:
the pipeline's own ceiling is ~100 leads/tenant/day (10 keywords x 10 results x one daily scan x
one provider), about $0.05/tenant/day. The tier is what stops a raised keyword cap or a second
enabled provider from scaling the bill with nothing in the way. Metering requires the tenant, so
`userId` now rides the `opportunity.discovered` payload — the outbox worker has no session.

Four bugs found while wiring it, each of which would have been invisible in production:

- **`AuroraService` decided `FALLBACK` by string-matching** the literal `'Classifier failed or
  timed out'` in `reasons`. Every real failure mode reports different prose, so all of them would
  have been recorded as `LIVE` with real provider provenance and confidence 0 — indistinguishable
  from a genuine low-confidence verdict. Now keyed on `failureCode`.
- **The classifier emitted `businessFit: 'EXCELLENT'`**, which `CanonicalPolicyScorer` does not
  match — it adds 15 points only for `'HIGH'`. The best-sounding answer scored the same as the
  worst. The response schema now permits only HIGH/MEDIUM/LOW.
- **Provenance was hardcoded `'gemini-1.5-flash'`**, a model string that appears nowhere else
  here (`GEMINI_MODEL` defaults to `gemini-2.5-flash`). Now read from env.
- **The consumer never supplied `ageDays` / `exactMatch` / `sourceQuality`**, the only three
  signals `DeterministicScorer` reads — so the deterministic half was a no-op that still looked
  like it had run. It is what the `FALLBACK` path leans on when the classifier cannot answer.

**The swallow is gone, and this is a behaviour change.** `AuroraService.evaluate` used to catch
any unexpected failure, persist a synthetic score-0 / `IGNORE` / `UNAVAILABLE` decision, and
return normally. That was the worst available outcome: resolving tells `EventProcessor` the event
succeeded so it is never retried, and the persisted row then trips the idempotency guard, making
the skip permanent. A dropped connection buried a real lead forever as a verdict the read layer
cannot distinguish from a considered one. It now rethrows and persists nothing, so the outbox
retries with backoff and dead-letters to `FAILED` where `OperationalHealthService` already counts
it. `UNAVAILABLE` stays in the union for historical rows.

**Withdrawn, not fixed:** the "`ai` tier is charged under two identifiers" entry was wrong. It
assumed an internal DB id distinct from the Clerk id; there is no such thing here — `User.id` *is*
the Clerk id (see §3.1), so `gemini/chat`'s `user.id` and `withServerAction`'s `auth().userId` are
the same string and share one 20/h bucket. The tier already behaves as "one AI budget per account".
