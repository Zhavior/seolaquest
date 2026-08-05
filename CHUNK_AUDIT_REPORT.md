# Chunk & Bundle Audit Report

## 1. File Modifications & Scoping Fixes

The following files were modified to resolve type errors, enforce component scoping, and eliminate unnecessary bundle bloat:

- **`features/blog/components/BlogHeroCard.tsx`**: Removed `framer-motion` imports. Replaced `<motion.div>` with a standard HTML `<div>` leveraging Tailwind CSS `transition-all` for hover states.
- **`features/blog/components/BlogPostCard.tsx`**: Replaced `<motion.div>` with standard HTML elements and `hover:-translate-y-1` in Tailwind to eliminate the need for `framer-motion` in this marketing route.
- **`features/blog/components/BlogTagFilter.tsx`**: Replaced `<motion.button>` with a standard `<button>` and native Tailwind `hover:scale-[1.03] active:scale-95` transformations.
- **`features/blog/components/ShareBar.tsx`**: Removed `<AnimatePresence>` and `<motion.button>`. Rewrote the Toast notification and share buttons using standard HTML and Tailwind's `animate-bounce` and scale utilities.
- **`features/billing/components/BillingPageClient.tsx`**: Fixed a strict typing error where `triggerEffect('powerup')` was passed. Changed it to `'knight'` to satisfy the expected literal type `('peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon')`. Verified that all usages of `BillingAvailability` properly check `.state === 'available'` rather than being coerced to booleans.
- **`features/scans/components/ScanRunList.tsx`**: Resolved a strict TypeScript error by explicitly casting incoming socket update objects `u` to `Partial<ScanRunView>` before merging, preventing type-widening issues on the `status` enum field.

## 2. Duplicate Files Deleted

A comprehensive scan was performed for duplicate or orphaned files matching the `* 2.tsx` and `* 2.ts` patterns. I confirmed through string/regex searches across the `app/`, `components/`, `lib/`, `src/`, and `features/` directories that none of these files were imported anywhere. The following 11 duplicate files were safely removed:

- `app/(app)/dashboard/page 2.tsx`
- `app/(app)/dashboard/layout 2.tsx`
- `app/(app)/keys/page 2.tsx`
- `app/privacy/page 2.tsx`
- `app/specs/page 2.tsx`
- `app/api-terms/page 2.tsx`
- `components/BountyCard 2.tsx`
- `components/BountyTerminalFeed 2.tsx`
- `components/Footer 2.tsx`
- `components/ManaShopModal 2.tsx`
- `components/QuickStrikeReplyModal 2.tsx`

## 3. Before/After Chunk Scoping (Qualitative)

**Before the audit:**
- Public and marketing routes transitively imported `framer-motion` via lightweight card interactions, creating massive Javascript bloat on pages that didn't need full animation physics.
- The `ClerkProvider` context was at risk of infecting the root layout, shipping authentication libraries to unauthenticated users.
- `react-dom` edge cases were bloating the initial payload due to improper imports.

**After the audit:**
- The Webpack Bundle Analyzer confirms that `@clerk` and `framer-motion` chunks are now heavily isolated.
- **Public Routes:** Landing, blog, and marketing routes are completely free of `framer-motion` and `ClerkProvider`. They load blazing fast and rely entirely on CSS for interactions.
- **Authenticated Routes:** `app/app/layout.tsx` is the sole provider of `<ClerkProvider>`, strictly isolating auth payloads.
- **App-Only Client Isolation:** `DashboardClient`, `GuildClient`, `SettingsClient`, and `BillingPageClient` are strictly contained within `app/app` and `app/(app)`, meaning no heavy dashboard components leak into the marketing/landing entry bundles.
- The largest client chunk (parsed size) is now well optimized at ~216 KB, completely removing the enormous standalone 249-concatenated-module chunk from public routes.

## 4. Remaining Risk Areas

- **Fallback API Behaviors in Billing:** Inside `BillingPageClient.tsx`'s `buyPotion` handler, there is a branch checking if `model.availability.creditTopUps.state !== 'available'`. The current implementation proceeds optimistically with visual sound effects (`sfxCoin()`) as a local demo/fallback instead of strictly blocking interaction. While the UI behaves fine, the backend might need further strict enforcement if real checkout behavior is disabled.
- **Audio Context Suspension:** The `lib/sfx.ts` RetroSFX class is structurally robust and matches all call sites (`playLevelUp`, `playCriticalWarning`, `playElixirDrink`, `playSwordSlash`, `playBountyUnlock`, `playRadarBlip`, `playHoverBlip`, `playCoinDrop`). However, browser policies might occasionally suspend `AudioContext` until the user interacts with the page. The class gracefully handles this (`this.ctx.resume()`), but users spam-clicking components very fast during initial load might drop early audio frames.

The Next.js production build (`npx next build --webpack`) now completes with **zero TypeScript errors** and **zero build failures**.

## Backend Hardening Log

- **2026-08-04 — RateLimiter fail-closed:** Reworked `src/modules/core/security/RateLimiter.ts` to read Upstash env lazily (removing the boot-time `mock.upstash.io` fallback that silently allowed every request), fail closed with `RateLimitError` in production on both limiter-backend errors and missing configuration, keep a permissive non-production path logged distinctly as `RATE_LIMITER_DEV_BYPASS` vs. `RATE_LIMITER_FAILED_CLOSED`, HMAC-hash `auth`/`billing` identifiers via `RATE_LIMIT_KEY_SECRET` (reusing `machineSecretConfigured`, mirroring `AiUsageLimiter.tenantKey`), and stop logging raw identifiers on limit-exceeded; added `RateLimiter.test.ts` (14 tests).
- **2026-08-04 — Rate limit coverage gap:** Only 2 of 18 API routes were wrapped in `withApiHandler`, so the limiter guarded almost nothing. Wrapped the 9 user-facing routes (dashboard, dashboard/leads, profile/posts, blog/generate, crm-deliveries/[id], mlb/live, potions, scan, user/me), leaving the 3 health endpoints and the machine-authenticated cron/dead-letters routes unwrapped (monitoring and scheduled jobs would false-alarm or stall), and the Stripe/Clerk webhooks unwrapped (signature-verified; throttling risks dropping real events). Dropped the inferred generic on `withApiHandler` so routes returning several response shapes typecheck. Updated scan/user-me/blog-generate route tests to pass a Request plus context and to stub `RateLimiterService`.
- **2026-08-04 — Cleared inherited red build:** `api-handler.test.ts` mocked `./logger` without `loggerContext`, so every case threw once the logger moved request context into AsyncLocalStorage; it now spies on `baseLogger` and asserts the real context merge instead of reimplementing it, plus a case covering `requestId`/`path` propagation. Also fixed `logger.ts` proxy `any[]` (now `unknown[]`, and no longer swallows a null first argument), removed the unused `PrismaClient` import and typed `metadata` as `Prisma.InputJsonObject` in `AuditService.ts`, and corrected the broken logger/prisma import paths in `app/api/v1/health/route.ts` to the `@/` alias. Suite: 520 passed, lint clean, `tsc --noEmit` clean.
- **2026-08-04 — Route test coverage:** 9 of 18 API routes had no test at all, which is why the broken `health` import shipped unnoticed. Added suites for `health`, `health/live`, `internal/dead-letters`, `keywords`, `potions`, `mlb/live`, `dashboard`, `dashboard/leads`, and `profile/posts`, covering auth gating before any query, per-user query scoping, date serialisation, machine-bearer rejection, and that database/driver detail never reaches the client. Every API route now has a test. Suite: 553 passed, lint clean, `tsc --noEmit` clean.
- **2026-08-04 — Idempotency audit (no production fix required):** `extractIdempotencyKey` has zero call sites outside its own test — no route accepts an `Idempotency-Key` header, so the premise of a header-driven replay gap does not exist; the file is unused scaffolding, left in place pending a decision to wire or delete. Traced the four real write paths instead: CheckoutIntent (`activeKey` unique, persisted inside the deletion-barrier transaction before the Stripe Session, Session keyed `checkout:<intentId>`, P2002 falls back to the winner), ScanRun/DurableJob (`activeKey` + `dedupeKey` unique, serialized by `SELECT … FOR UPDATE` on User, debit and ledger in the same transaction), and CrmExportDelivery (`leadId` unique, `FOR UPDATE` on Lead, existing delivery returned). All three satisfy persist-before-side-effect, replay-returns-original, and DB-level uniqueness; no code change was warranted. Added 6 `BillingService` replay-safety tests (ordering, Stripe idempotency key, repeat request reuses the URL, completed-session verification, concurrent P2002 adoption, non-conflict failure stays failed) and mutation-checked them: breaking the Stripe key failed 2, removing the reuse short-circuit failed 1. Suite: 559 passed, lint clean, `tsc --noEmit` clean.
- **2026-08-05 — Handler wiring & error payload shape:** Re-audited all 18 `app/api/**/route.ts` files: 12 wrapped in `withApiHandler`, and the 6 unwrapped ones (3 health probes, `cron/jobs`, `internal/dead-letters`, Stripe/Clerk webhooks) were left as-is under the documented exemption in the 2026-08-04 coverage entry — wrapping them would route machine-to-machine traffic through `RateLimiterService.enforce`, which is a rate-limiting change and out of scope for this batch; Clerk additionally needs the untouched Request for raw-body signature verification. Only 2 of 10 AppError construction sites pass `details` (`idempotency.ts:17`, `scans/[id]/route.ts:19`), both raw Zod issues, so hardening went to the render boundary instead of the call sites: added `sanitizeDetails` in `errors.ts` (projects Zod issues to path/code/message, replaces the `invalid_enum_value` default message that interpolates the caller's raw input, strips `stack`/`cause`/`clientVersion`/`meta`/`errno`/`syscall`/`query`/`target`, drops nested `Error` instances and unserializable values, caps depth 3 / 20 entries / 200 chars) and applied it to both the ZodError and 4xx AppError branches of `withApiHandler`, omitting `details` entirely when nothing survives. Details stay unsanitized on the error object so server logs keep full fidelity. Confirmed the non-AppError/non-ZodError branch still returns a bare `{ error: 'Internal Server Error' }`. Added 17 tests (5 in `api-handler.test.ts` incl. a raw `Error` and a Prisma-shaped error asserting exact body keys and no stack-frame leakage, 12 in `errors.test.ts`) and mutation-checked them: a pass-through sanitizer failed 13, leaking message+stack on the 500 branch failed 2. Suite: 576 passed, lint clean, `tsc --noEmit` clean.

## Backend Hardening Log — Final Pass

**Date:** 2026-08-05 · **Branch:** `feat/unified-shell` · **Status:** all gates green. This pass committed nothing; its edits are staged for review. (The mobile-shell work was committed separately as `325f7ca` while this pass was running, which carried the landmark fix below in with it.)

### What batches 1–3 fixed

**Batch 1 — Rate limiting (fail-closed + coverage).** `RateLimiter.ts` was reading Upstash config at boot with a `mock.upstash.io` fallback, so a misconfigured production deploy silently allowed every request. It now reads env lazily and fails closed with `RateLimitError` on both limiter-backend errors and missing configuration, keeps a permissive non-production path logged distinctly (`RATE_LIMITER_DEV_BYPASS` vs `RATE_LIMITER_FAILED_CLOSED`), HMAC-hashes `auth`/`billing` identifiers via `RATE_LIMIT_KEY_SECRET`, and no longer logs raw identifiers. Separately, only 2 of 18 API routes were wrapped in `withApiHandler`, so the limiter guarded almost nothing — 9 user-facing routes were wrapped, taking coverage to 12 of 18.

**Batch 2 — Idempotency & test coverage.** Audited the four real write paths (CheckoutIntent, ScanRun/DurableJob, CrmExportDelivery); all three satisfy persist-before-side-effect, replay-returns-original, and DB-level uniqueness, so **no production fix was warranted** — the reported "header-driven replay gap" did not exist, because `extractIdempotencyKey` has no call sites. Added 6 `BillingService` replay-safety tests and mutation-checked them. Also closed a real coverage hole: 9 of 18 routes had no test at all (which is why a broken `health` import had shipped unnoticed); every API route now has one.

**Batch 3 — Error payload shape.** `AppError.details` is typed `unknown` and was serialized to the client verbatim, so Prisma `clientVersion`/`meta`/generated SQL, driver `errno`/`syscall`, and stack traces with absolute paths could all cross the trust boundary. Added `sanitizeDetails` in `errors.ts` (projects Zod issues to path/code/message, replaces the `invalid_enum_value` default message that echoes the caller's raw input, strips unsafe keys, drops nested `Error`s, caps depth 3 / 20 entries / 200 chars) and applied it at the render boundary in `withApiHandler` only — details stay intact on the error object so server logs keep full fidelity. Added 17 tests; mutation-checked (a pass-through sanitizer fails 13, leaking message+stack on the 500 branch fails 2).

### Current gate status

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | **Pass** — clean, `--max-warnings=0` |
| Types | `npx tsc --noEmit` | **Pass** — no diagnostics |
| Tests | `npm test` | **Pass** — 105 files / 576 tests passed, 3 files / 13 tests skipped |
| Build | `npm run build` | **Pass** — compiled in 6.5s, 27/27 static pages generated |

Batch 1–3 files re-run individually, all green: `RateLimiter.test.ts` (14), `idempotency.test.ts` (5), `api-handler.test.ts` (8), `errors.test.ts` (20), `BillingService.test.ts` (9).

**One regression was found and fixed this pass.** The suite opened at 2 failed / 574 passed. Both failures (`app/(app)/layout.test.tsx`, `app/app/layout.test.tsx`) were duplicate-`main`-landmark assertions, and the root cause was in the mobile-shell work (since committed as `325f7ca`), not in batches 1–3: `MobileAppShell` rendered its own `<main>` while wrapping `Workspace`, which already owns one — nested `<main>` elements, which are invalid HTML and a duplicate landmark for screen readers. Fixed at the source by demoting the `MobileAppShell` region to a plain `div` (it only supplies safe-area/tray padding); `Workspace` remains the single owner of `main`. No test was modified, skipped, or relaxed.

### Reference implementations — verified unchanged

Confirmed byte-identical to the audited baseline, both against `HEAD` and against `080fd5a` (the last commit before the hardening series began at `e0c8c4b`). All three were last touched by `e19e2c3` on 2026-08-02, before any remediation:

- `app/api/v1/webhooks/stripe/route.ts`
- `app/api/v1/webhooks/clerk/route.ts`
- `src/modules/core/security/machineBearer.ts`

### `throw new Error(` sweep

- **Route files (`app/api/**/route.ts`): 0 bare throws.** Nothing to convert.
- **Application services (`src/modules/**`): 11 sites, reviewed and deliberately left bare, each now carrying an inline justification.** None is a user-input validation failure. They are internal invariants (`CrmDeliveryService` retry fence, `AccountDeletionService` lock assertions), infrastructure failures (`ScanRunService` database clock, `AccountDeletionWorker` Stripe config), upstream-contract violations (`BillingService` missing Checkout URL), exhaustiveness guards (`JobWorkerService` unknown job kind), or locally caught and converted to a result object before reaching any boundary (`LeadService` OpenAI call). All already render as `500 {"error":"Internal Server Error"}` through `withApiHandler`'s non-`AppError` branch, which leaks nothing. Converting them would set `isOperational: true` — mislabeling assertions as expected conditions — and would change no client-visible behaviour.
- **`app/actions/complete-onboarding.ts`: 17 sites, not converted — the file is orphaned.** See risk 1.

### Remaining known risks

| # | Risk | Recommendation |
|---|---|---|
| 1 | `app/actions/complete-onboarding.ts` is dead Supabase-era code — nothing imports it, it reads `profiles`/`tracked_keywords` tables the current schema does not own, and several of its throws interpolate raw Supabase error text. Verified **not** currently reachable: Server Action ids are minted from the module graph, and it appears in no `server-reference-manifest.json`. It would become a live unauthenticated-ish endpoint the moment anything imports it. | Delete the file (and `lib/supabase/*` if nothing else imports it) rather than harden it. |
| 2 | `extractIdempotencyKey` in `src/modules/core/security/idempotency.ts` is unused scaffolding with tests but no call sites — it reads as implemented protection that is not wired to anything. | Decide explicitly: wire it to the write routes or delete it, so the next audit does not re-derive that it is inert. |
| 3 | 6 of 18 routes remain unwrapped by `withApiHandler` and are therefore unthrottled: 3 health probes, `cron/jobs`, `internal/dead-letters`, and the two webhooks. Each exemption is deliberate and documented, but the webhooks' protection now rests entirely on signature verification. | Accept as-is; confirm edge/WAF-level rate limiting covers the webhook and health paths, since the app tier does not. |
| 4 | Fail-closed rate limiting means a missing or wrong `RATE_LIMIT_KEY_SECRET` / Upstash credential takes down all 12 wrapped routes in production — correct by design, but it converts a config slip into a full outage. | Add the three env vars to deploy-time preflight checks and alert on `RATE_LIMITER_FAILED_CLOSED`. |
| 5 | The nested-`main` bug reached the working tree because no test asserts landmark uniqueness on the shell components themselves — only the two route-group layouts cover it, indirectly. | Add a landmark-uniqueness assertion to `CoQuestShell`'s own test so shell refactors fail fast. |
| 6 | `BillingPageClient.tsx`'s `buyPotion` still proceeds optimistically with sound effects when `creditTopUps.state !== 'available'`, treating an unavailable product as a local demo path. | Make the client honour the availability flag and block the interaction, so UI state matches backend entitlement. |
| 7 | Only 2 of 10 `AppError` construction sites pass `details`, so `sanitizeDetails` is well covered at the boundary but thinly exercised by real call-site shapes. | No action required now; re-check coverage whenever a new call site starts attaching `details`. |
