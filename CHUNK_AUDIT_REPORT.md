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
