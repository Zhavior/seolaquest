# SEOlaQuest page-loading architecture review

Reviewed September 6, 2026. Local checkout: Next.js 16.2.12, React 19.2.4, OpenNext Cloudflare 1.20.0, Prisma/adapter-pg 5.10.2, pg 8.16.3. This is an assessment and proposed implementation sequence; no application code was changed for this review. Existing uncommitted sound and corner fixes were preserved.

## Decision

Keep Next.js App Router, React, the persistent shell, and the domain backend. Upgrade the work performed during a page request. A framework rewrite is not justified by the evidence. The current architecture has useful foundations, but its loading path is not yet something I would certify as fast under production load.

## What actually loads a page

On a fresh authenticated document request:

1. `middleware.ts` runs Clerk protection and legacy redirects.
2. `lib/auth.ts:getCurrentUser` resolves the session, reads the database user, and checks deletion state when configured. It uses React `cache`, so repeated calls in one server render share work. Provisioning and remote Clerk profile lookup occur for missing accounts; existing ordinary users do not always incur that profile lookup.
3. `app/app/layout.tsx` waits for the user/onboarding check. For the owner's email it also awaits verified Clerk admin identity. It then waits for `toShellUser` before returning the shell.
4. `lib/shellUser.ts` awaits quest enrollment, then reads progression and the open-lead count concurrently. Enrollment normally reads the active catalog and the user's assignments; it can write missing assignments/profile records.
5. Route-specific Server Components load data. Dashboard data uses concurrent queries, then sends props to the large interactive dashboard. The follow-up/history section has its own Suspense boundary.
6. React hydrates interactive controls. Sidebar Links and Next's router handle subsequent navigation; shared layouts are reused rather than fetched automatically on every click.

The layout and page are not a reliable global transaction or execution-order barrier. Moving enrollment requires preserving its ordering before quest contribution; simply removing its await would risk missed rewards.

On a warm route change, cached page segments and prefetched loading boundaries can make navigation responsive while destination data loads. The 30-second `staleTimes.dynamic` setting is a browser-router policy, not a database cache. Explicit `router.prefetch` follows a different cache lifetime under this installed Next version. Neither guarantees permanently fresh HUD values.

## What is already good

- One persistent authenticated shell, normal `Link` navigation, hover/focus prefetch, mobile intent prefetch, and page loading boundaries.
- Server-owned authentication and admin authorization. Admin checks at service boundaries must remain even when layouts already checked access; request memoization reduces repeated identity work.
- Concurrent independent dashboard, admin, and pipeline queries.
- Explicit lead projection with a 24-result limit, 50 tracked leads, and bounded nested outcome history. Lead and latest Aurora decision indexes already exist; do not add duplicate indexes speculatively.
- Server-rendered HUD slot avoids shipping the account object into the interactive shell.
- Conditional dynamic imports for reply/scanner modals; isolated follow-up streaming.
- Immutable build-asset headers already exist in `public/_headers`.

## Findings and fixes, in priority order

### 1. High: database client lifetime needs Cloudflare runtime validation

`lib/prisma.ts` constructs one module-level Prisma client and pg pool. Production `maxUses: 1` limits connection reuse, but does not make the pool request-scoped. OpenNext's database guide explicitly recommends request-scoped clients for PostgreSQL in Workers. This is a compatibility risk supported by the source mismatch, not a reproduced concurrent-request failure in this review.

Use a request-owned database context for Server Components, Route Handlers, Server Actions, and jobs. React `cache` is useful inside a server render but is not a universal request-local container for every execution path. Thread the request's client through existing service constructors/transaction arguments. Do not replace a global singleton with thousands of uncontrolled pools or disconnect while sibling queries still run. Preserve the different constructor API in installed adapter-pg 5.10.2; current website examples use newer APIs.

Measure current database region, connection setup latency, concurrent request behavior, and pool limits. Evaluate Hyperdrive for connection pooling if network setup dominates. Its connection pool is distinct from query-result caching; keep result caching disabled for authorization, credits, entitlements, rewards, and other reads requiring current state. Do not casually remove `maxUses: 1` to save handshakes.

Sources: [OpenNext database integration](https://opennext.js.org/cloudflare/howtos/db), [Hyperdrive connection pooling](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/).

### 2. High: nonessential HUD work blocks the initial shell

Evidence: `app/app/layout.tsx:22`, `lib/shellUser.ts:68`. Even Settings and Admin wait for quest enrollment plus HUD reads when the layout renders. Page-level `loading.tsx` cannot make an unresolved parent layout finish sooner.

First separate authorization from telemetry. Keep access checks awaited; render the HUD through an async Server Component inside a small Suspense boundary, with a quiet unavailable/loading state. Next move enrollment ownership into onboarding plus an idempotent quest-event/action path that guarantees assignments exist before contribution. Use the event's occurrence/cycle semantics so delayed events and midnight rollover remain correct. Only remove shell enrollment after these guarantees are tested. The current enrollment query also retrieves historical cycles: query only current quest/cycle pairs.

Do not replace a failed HUD count with a believable zero. Current `countOpenQuests` does this, and progression catches return unranked. Distinguish an empty record from an unavailable database.

### 3. Medium: avoidable repeated database reads

Evidence: `app/app/page.tsx:34` fetches the subscription directly while `EntitlementService.forUser` fetches it again. HUD and dashboard/quests separately call uncached `readHunterProgression`.

Create one request-memoized subscription reader and derive the display label and entitlements from the same snapshot, preserving stored-plan versus effective-plan semantics. Share a request-memoized progression read after the enrollment ordering issue is addressed. Keep action-time authorization and credit checks current; do not apply a shared TTL to them.

React's `cache` is request-scoped and also caches errors. It is the appropriate first step for deduplication, not a cross-user cache. [React cache reference](https://react.dev/reference/react/cache).

### 4. Medium: local filtering triggers server navigation

Evidence: `features/dashboard/hooks/useDashboardState.ts:141–158`. Platform filtering uses `router.replace`, although the displayed leads are filtered from the already loaded array. That can request another RSC render for a display-only change.

Use Next-integrated native history for this local filter, preserving other query parameters, the current path, and the URL hash. Conceptual replacement for the final statement in `setFilter`:

```ts
const query = params.toString()
window.history.replaceState(
  null,
  '',
  `${pathname}${query ? `?${query}` : ''}${window.location.hash}`,
)
```

This is a proposed snippet, not applied or tested code. Verify filter display, reload restoration, other query parameters, and Back/Forward behavior. Use server navigation again if filtering becomes server-side pagination/search. The installed Next documentation explicitly supports history integration with `useSearchParams`.

[Next navigation and history](https://nextjs.org/docs/app/getting-started/linking-and-navigating).

### 5. Medium: repeated refreshes after scans

Evidence: `useDashboardState.ts:306–308` and `384–386` await `/api/dashboard/leads`, then call `router.refresh`, whose dashboard render reads the queue again. This gives fast local results but pays for overlapping work.

Choose one authoritative refresh strategy per mutation. If a full refresh is needed for credits, HUD, and pipeline, start it without first blocking on a duplicate queue request. If a targeted response becomes authoritative, update all affected state and invalidate the appropriate route data once. Keep idempotency and server-confirmed rewards. Measure request counts before selecting the approach; don't remove freshness updates blindly.

### 6. Medium now, higher with account age: unbounded historical reads

- `GamifyQuestQueryService.getAssignments` reads every assignment and the Quest Board renders all settled history.
- Enrollment reads every historical cycle for the active quest IDs.
- `AnalyticsService.getGuildStats` loads all contacted leads to calculate the top keyword in JavaScript.

Fetch active/claimable assignments separately from cursor-paginated settled history. Preserve all actionable quests and correct expiry classification; do not put one arbitrary limit over the entire board. Aggregate top-keyword counts in the database with deterministic tie-breaking. Query existing indexes first and use EXPLAIN on realistic data before changing indexes. These are growth risks, not proven slow queries at today's small account size.

### 7. Medium: Admin lacks its own loading boundary

`app/app/admin/page.tsx` waits for seven concurrent counts; operations waits for seven queries. There is no admin `loading.tsx`, so the parent Battle Area fallback is inherited. One count failure rejects the entire overview.

Add an admin-specific quiet loading state and stream independent metric groups below the authenticated admin header. Isolate unavailable groups if that is useful operationally. Exact global counts may eventually need aggregate snapshots, but introduce those only after measurement and display their freshness. Keep admin data private and checks in every service. Never cache the whole admin HTML publicly.

### 8. Medium: apparent lazy loading is not always deferred loading

The installed Next guide says dynamically importing a Client Component from a Server Component does not currently support automatic code splitting. Page-level `next/dynamic` wrappers alone are not proof of a smaller initial payload. The CommandPalette is also always mounted: `ssr: false` avoids SSR but does not mean it waits for the user to open it.

Measure the authenticated bundle, then keep interactive state near controls, move static sections to Server Components where practical, and defer genuinely optional UI from a client boundary. Do not add memoization or React Compiler as a substitute for removing server waits. Avoid a wholesale dashboard rewrite solely because a component is long.

[Next lazy loading](https://nextjs.org/docs/app/guides/lazy-loading). The installed 16.2.12 documentation was checked; current online docs may describe newer Next releases.

### 9. Measurement and cache infrastructure gaps

The bundle budget script explicitly excludes authenticated `/app/*` routes. A passing public build budget does not certify dashboard/admin payloads. `open-next.config.ts` has no explicit persistent cache overrides, and Wrangler has no incremental/tag-cache bindings. Do not assume adding `use cache` or a revalidation call creates a fully configured distributed cache.

Start with request deduplication. Add persistent caching only for a defined read contract, with explicit user scope where applicable, expiry, invalidation, and failure behavior. Public/static caching and private operational data need separate policies. Cache Components is a later compatibility-tested migration, not a one-flag quick fix. Keep the middleware filename until the selected OpenNext release supports the relevant Node middleware/proxy path; current OpenNext documentation still lists a limitation.

[OpenNext caching](https://opennext.js.org/cloudflare/caching), [OpenNext performance](https://opennext.js.org/cloudflare/perf), [OpenNext compatibility](https://opennext.js.org/cloudflare).

## Evidence limits and acceptance plan

Existing local development logs show `/app` responses of 6.3s and 12.2s and `/app/admin` at 4.2s, including 3.4s attributed to application code for that admin request. These are individual development observations, not controlled benchmarks, production percentiles, or database-only timings. Development compilation, auth, concurrent work, and network latency can distort them. Automatic prefetch behavior also differs in development. No production speedup is claimed.

Run the following before and after each small patch:

1. Authenticated production-build baseline for Dashboard, Keywords, Quests, Runs, Guild, Settings, and Admin. Separately exercise the OpenNext `workerd` preview; `next dev` is not a Cloudflare runtime test.
2. Record fresh-load and warm-navigation results separately: click-to-feedback, click-to-usable destination, RSC response time, query counts/durations, connection setup, JS transferred/decoded, long tasks, and Worker CPU versus wall time. Collect repeated samples; do not call a tiny sample a p95.
3. Exercise ordinary user, owner, deleted/revoked session, and two concurrent accounts. Verify private data never crosses identities.
4. Test slow/failed HUD reads, new-user enrollment, daily/weekly rollover, delayed/replayed events, claim idempotency, and credits/entitlements after mutation.
5. Put authenticated route budgets into regression checks. Initial product target: visible navigation feedback within 100ms on the agreed test device; agree data-ready targets from the production baseline. This is a target, not an achieved measurement.

Recommended sequence: baseline and Worker database ownership → shared-shell/HUD and enrollment correctness → duplicate reads/local filter/refresh cleanup → admin streaming and bounded history → measured bundle reduction → persistent caching only where still justified. Keep the existing framework throughout.

## Revised delivery contract: preserve the lighter UI, remove waiting

The user's priority is to retain the lighter interface and make page switching feel immediate. Treat backend waiting and navigation behavior as the first optimization candidates. Do not redesign the interface, switch frameworks, add a global client-state library, or add distributed caching without a measured reason. The lighter UI is a product constraint; its current authenticated JavaScript cost still needs measurement.

### Performance targets

These are proposed acceptance targets, not results or universal guarantees. Measure from an actual click until the next painted response; measure usable content separately so a spinner cannot pass as a loaded page.

| Scenario | Acceptance target |
| --- | --- |
| Every internal navigation | Visible pending/selected response within 100ms at p95; existing shell stays usable |
| Warm, previously visited route with valid cached data | Destination primary content usable within 300ms at p95 |
| Uncached internal navigation | Primary content usable within 1 second at p95 on the reference desktop connection |
| Fresh authenticated document | Primary content usable within 2 seconds at p95 on the reference desktop connection |
| Local platform filter | Updated displayed results within 100ms at p95; zero RSC/API requests caused by filtering |
| Slow optional HUD/history/aggregate read | Navigation and unrelated controls stay usable; explicit pending/unavailable state |
| Mutations affecting credits, permissions, rewards | Correct server confirmation and refreshed affected values; never trade correctness for apparent speed |

Run an initial 30-sample screening per route/scenario; use at least 100 samples for a reported p95, and record failures rather than excluding them. Include Dashboard, Keywords, Quests, Runs, Guild, Profile, Settings, Billing, Leads, Deliveries, and all Admin pages. Separate cold and warm runs; record account data size and cache state. Do not replay billing purchases, scans, or external deliveries to collect timing samples.

Reference desktop: record hardware/browser versions; use a fixed test profile of 20Mbps down, 5Mbps up, and 50ms added latency. A separate mobile profile uses a 390px viewport, 4x CPU slowdown, 4Mbps down, 1Mbps up, and 150ms added latency. Mobile targets: feedback within 200ms and uncached primary content within 2.5 seconds at p95. Emulation is a repeatable check, not a substitute for one real mid-range phone check. Run production Next and Cloudflare staging separately. Geographic results remain separate, including a Philippines-origin measurement when available.

### Small patches with clear stopping points

1. **Baseline first:** authenticated route timing and request counts, Worker CPU/wall time, database connection/query spans, and decoded client JavaScript. Capture a baseline receipt before optimization. Do not repeat costly builds after documentation-only changes.
2. **Remove avoidable work:** native-history local filtering; deduplicate subscription reads with preserved entitlement semantics; remove the sequential double queue refresh after scans while retaining correct HUD/pipeline updates. Verify request counts and mutation results after each patch.
3. **Unblock the shell:** stream optional HUD data and independent admin sections. Preserve authorization. Establish event-owned enrollment guarantees before removing layout enrollment; test cycle rollover and delayed events. Request-cache progression only once reads cannot race enrollment.
4. **Validate Worker database ownership:** exercise two concurrent accounts and repeated requests. Introduce request-owned clients consistently across rendering, actions, handlers, and jobs where required. Evaluate Hyperdrive only against measured connection setup cost. No blanket Prisma major upgrade in this patch.
5. **Bound growth:** separate actionable quests from paginated historical quests; aggregate Guild results in SQL; retain relevant existing indexes. Use realistic disposable test data, not invented production records.
6. **Close only measured residual gaps:** inspect authenticated chunks and React commits. Defer the command palette only if its initial cost is material. Add persistent caching or change deployment placement only when residual measurements justify it.

Each patch must preserve the previous sound/corner work, produce its relevant test/browser evidence, and be independently reversible. A step passes only when its intended improvement is measured and correctness checks hold. If a target is missed, record the failing route and dominant remaining wait; do not lower the target silently or call the overall result complete.

### Required final receipt

Provide a before/after table by route and environment, sample counts, p50/p95, failure counts, request counts, authenticated JS sizes, and the exact tested commit. Include ordinary-user/admin isolation, revoked-session handling, midnight rollover, replay/idempotency, and post-mutation freshness checks. Distinguish local production-build proof, Worker staging proof, and actual deployed verification. No “10/10” or “lightning fast” claim from a passing unit suite or a loading animation alone.
