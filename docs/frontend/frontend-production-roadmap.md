# CoQuest Frontend Production Roadmap

Status: proposed execution plan  
Baseline: 58/100 local frontend audit  
Target: 97+/100 before general availability; 100/100 only after production evidence  
Execution model: two phases at a time

## 1. Executive verdict

The frontend has a strong visual identity, but it is not yet a dependable paid-SaaS product. The screenshots look substantially more finished than the customer journey behaves.

The fastest path to production is not another redesign. It is one narrow, truthful journey that works every time:

1. Visitor lands on the public product page.
2. Visitor understands that CoQuest finds keyword matches and what a paid scan costs.
3. Visitor creates an account.
4. New user completes a useful onboarding flow.
5. User saves a real persisted keyword.
6. User sees the exact entitlement and price before starting a scan.
7. Scan remains recoverable across refreshes and ends in a durable status.
8. Results appear without a hard reload.
9. User can qualify, dismiss, contact, or export a result.
10. Billing, delivery, and failure states always tell the truth.

Until that journey is proven, broadening the product is a distraction.

## 2. What “100/100” means

A code review cannot award a real 100/100. The score is earned in layers.

### 2.1 Code-complete threshold: 90/100

- No known P0 or P1 frontend defects.
- One canonical route and component for every core product capability.
- All client/server contracts are runtime validated and typed.
- Core flows have automated integration and end-to-end coverage.
- WCAG 2.2 AA requirements are met for core journeys.
- Performance budgets pass in repeatable preview tests.

### 2.2 Release-candidate threshold: 95/100

- Preview environment passes full browser, API, persistence, billing, and worker tests.
- Production configuration is validated without exposing secrets.
- Failure, timeout, retry, empty, loading, and offline states are intentional.
- Analytics and error reporting prove each funnel boundary.
- Rollback has been rehearsed.

### 2.3 Production-proven threshold: 97–100/100

- Real customers complete the entire paid journey.
- No unresolved P0/P1 issues through the observation window.
- Production Core Web Vitals meet the agreed p75 budgets.
- Scan, checkout, CRM delivery, and authentication terminal outcomes are observable.
- Support tickets and session evidence show that customers understand what the product does.
- The team has completed accessibility, security, billing, and recovery audits using production-like data.

The final three points cannot be manufactured locally. They require real production evidence.

## 3. Score model

| Area | Current | Target | Weight |
| --- | ---: | ---: | ---: |
| Core journey reliability | 46 | 100 | 22% |
| Product truth and buyer trust | 49 | 100 | 16% |
| Accessibility | 38 | 100 | 14% |
| Mobile usability | 61 | 100 | 12% |
| Architecture and maintainability | 60 | 100 | 12% |
| Performance | 60 | 100 | 10% |
| Test and release confidence | 40 | 100 | 10% |
| Visual design and consistency | 88 | 100 | 4% |

No phase is complete merely because the weighted score increases. Every phase has binary acceptance gates.

## 4. Non-negotiable product contracts

These decisions must be recorded before implementation begins.

1. **One brand:** select CoQuest or HypeQuest and use it in page metadata, Clerk, email, billing, support, legal copy, analytics, and deployment names.
2. **One public root:** `/` is the marketing entry point. The authenticated application uses one explicit namespace such as `/app`.
3. **One keyword surface:** remove or redirect the duplicate `/dashboard/keywords` implementation.
4. **Truthful monitoring language:** until recurring schedules are enabled and verified, use “Tracked Keywords” and “Run Scan,” not “Deployed Agents,” “Monitoring,” or equivalent automation claims.
5. **Truthful free offer:** because free accounts currently receive zero scans, replace “Start Free Hunt” with “Create Free Account” and disclose when payment is required. A free scan may be offered only after its abuse and cost controls exist.
6. **Truthful results:** raw provider matches are not called qualified leads or buyer intent unless the product has evidence supporting that classification.
7. **Truthful billing:** never render invented balances, plans, rewards, scarcity, popularity, or delivery status while verified state is loading.
8. **Durable operations:** a queued operation must have an ID, a restorable status page, a terminal state, and a user action for retry or support.
9. **No hidden critical controls:** login, dismiss, close, cancel, retry, and navigation controls must work with touch, keyboard, and assistive technology.
10. **No success without evidence:** UI success is rendered only from a persisted or provider-confirmed outcome.

## 5. Canonical frontend architecture

### 5.1 Route model

```text
Public
├── /                         Marketing landing
├── /pricing                  Honest plan and credit explanation
├── /blog                     Public content
├── /status                   Customer-safe system status
├── /legal/*                  Terms, privacy, billing and refund policy
├── /sign-in                  Authentication
└── /sign-up                  Authentication

Authenticated
├── /onboarding               Mandatory until completed
└── /app
    ├── /                     Command center
    ├── /keywords             Canonical keyword management
    ├── /runs                 Durable scan history and statuses
    ├── /runs/[runId]         Restorable scan terminal view
    ├── /opportunities        Provider matches and qualification
    ├── /deliveries           CRM/export status and retry
    ├── /billing              Subscription, credits and receipts
    ├── /settings             Account, integrations, support and legal
    └── /profile              User profile
```

### 5.2 Rendering model

- Server Components own route data loading, authorization, metadata, and initial verified state.
- Client Components are small interaction islands.
- Never copy server props into client state unless reconciliation behavior is explicit and tested.
- Persisted mutations return their canonical DTOs, including real IDs and versions.
- Long-running operations use a shared durable-operation client with reconnect, timeout, retry, and terminal-state behavior.
- Loading models use discriminated states such as `loading`, `ready`, `empty`, `error`, and `unavailable`; they never use plausible fake data.
- Errors use one user-safe envelope with a request ID. Raw backend exception text is not rendered.

### 5.3 Shared frontend boundaries

```text
features/
├── acquisition/      landing, pricing and public evidence
├── auth/             sign-in, sign-up and onboarding gate
├── keywords/         canonical keyword UI and contracts
├── scans/            queue, run history and terminal status
├── opportunities/    result cards, qualification and actions
├── deliveries/       CRM/export status and retry
├── billing/          verified plans, credits and checkout
├── settings/         profile, integrations, support and legal
└── shared/           design system, error states and telemetry
```

Every feature owns:

- runtime schemas;
- server-facing client or Server Actions;
- view models;
- loading/empty/error states;
- unit and integration tests;
- analytics events;
- accessibility assertions.

## 6. Two-phase execution program

Only the active two phases may change product code. Later phases remain planned until the current pair passes its gates.

---

## Phase 0 — Product truth, route ownership and release freeze

### Objective

Remove the most damaging trust and navigation contradictions before deeper refactoring.

### Work

- Record the canonical brand decision and replace CoQuest/HypeQuest conflicts.
- Make `/` the public landing page and move the authenticated dashboard under `/app`.
- Create explicit public-route tests for landing, pricing, blog, status and legal pages.
- Redirect legacy `/landing`, `/dashboard`, and `/dashboard/keywords` paths to canonical routes.
- Require authentication for `/onboarding`; do not allow anonymous form submission.
- Replace unsupported “monitoring,” “deployed agent,” and “free hunt” claims.
- Remove billing rewards and popularity claims not backed by product behavior or evidence.
- Reconcile refund, dispute, consumer-rights, terms and settings copy.
- Replace `/specs` as customer status navigation with a real, safe `/status` page or remove the link.
- Add a feature inventory classifying every visible feature as live, beta, unavailable, or internal.
- Hide internal or unavailable functionality from primary customer navigation.

### Primary files

- `proxy.ts`
- `app/landing/page.tsx`
- `app/(app)/page.tsx`
- `components/Footer.tsx`
- `components/Sidebar.tsx`
- `features/landing/**`
- `features/billing/**`
- `features/settings/**`

### Acceptance gates

- Signed-out users can open every public navigation destination without an auth redirect.
- Signed-in users can open `/app` and are not sent back to marketing.
- Every legacy URL has an intentional redirect or 404.
- One brand name appears throughout the tested flow.
- No customer-visible claim promises automation, free scans, rewards, popularity, or qualification that the system cannot prove.
- Route-ownership tests run in CI.

### Expected score after Phase 0

63/100. The product is more honest, but core state bugs still remain.

---

## Phase 1 — Core state correctness and durable terminal outcomes

### Objective

Make keyword, scan and CRM operations behave correctly across refresh, delay and failure.

### Work

- Return the persisted keyword DTO from `addKeywordAction`.
- Remove timestamp-generated keyword IDs.
- Add optimistic state only when it can be reconciled by a stable mutation ID.
- Make deletion and retry idempotent.
- Stop copying initial dashboard props into permanently detached client state.
- Choose one authoritative state strategy:
  - render server state directly and use targeted optimistic overlays; or
  - reconcile local state whenever versioned server data changes.
- Introduce one durable-operation model for scans and CRM deliveries.
- Persist the active run ID in the URL and restore it after refresh or navigation.
- Add `/app/runs` and `/app/runs/[runId]` views.
- Render `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED_REFUNDED`, `DEAD`, `CANCELLED`, and `UNKNOWN` explicitly.
- Convert the 75-second polling ceiling into a recoverable background state, never an indefinitely active modal.
- Make every terminal modal closable and every nonterminal operation safely dismissible without losing the run.
- Poll CRM delivery status or subscribe to a trusted update channel.
- Surface retry only when the backend says retry is allowed.
- Add clear last-updated timestamps and request IDs to failure states.
- Add a route-level error boundary and branded retry state.

### Required contract tests

- Create keyword returns the database ID used by subsequent delete.
- Newly created keyword can be deleted immediately.
- Server refresh renders newly completed scan results without a hard browser reload.
- Refresh during a queued scan restores the same run.
- A run longer than 75 seconds remains recoverable and does not trap the interface.
- Provider failure renders the backend-owned terminal status and refunded balance.
- CRM delivery can progress from queued to delivered or dead, including retry.
- Duplicate clicks do not create duplicate mutations or charges.

### Acceptance gates

- Zero fake entity IDs in active frontend code.
- Zero long-running operations that exist only in component memory.
- All async operations have loading, terminal success, terminal failure, retry eligibility and navigation-away behavior.
- Core journey end-to-end tests pass against a real test database.
- No P0/P1 state-reconciliation issue remains open.

### Expected score after Phases 0–1

72/100. This is the first credible private-beta checkpoint.

---

## Phase 2 — Authentication and first-value onboarding

### Objective

Turn signup into a controlled journey that reaches the first useful outcome.

### Work

- Set explicit Clerk redirect URLs for sign-in and sign-up.
- Enforce onboarding completion on authenticated routes at a server-owned boundary.
- Read `onboardingComplete`; do not merely write it.
- Prevent completed users from re-entering onboarding accidentally.
- Replace the name/title-only form with a short first-value setup:
  1. display name;
  2. product or business description;
  3. target customer;
  4. first keyword or phrase;
  5. preferred source coverage;
  6. scan-cost explanation and next action.
- Save each step durably or save one validated final payload with a safe resume path.
- Add back, skip-when-safe and resume behavior.
- Show a real preview using clearly labeled example data or the user’s persisted keyword—never fabricated live results.
- Send users to the canonical keyword or dashboard view with their real saved keyword present.
- Add mobile-visible Login and separate sign-in/sign-up intent.
- Align Clerk appearance, product name, support link and legal links with the canonical brand.

### Acceptance gates

- New account always reaches onboarding before `/app`.
- Refresh and multi-tab navigation cannot bypass onboarding.
- Signed-out access to onboarding redirects to sign-in and returns afterward.
- Completion persists and survives a fresh browser session.
- The first saved keyword shown in `/app` uses the database ID.
- Desktop and mobile sign-in/sign-up routes are obvious and keyboard accessible.

---

## Phase 3 — Pricing, entitlement and billing truth

### Objective

Make the commercial experience understandable and incapable of showing false account state.

### Work

- Create one server-owned billing view model for subscription, credits, currency, renewal, cancellation and availability.
- Remove the client’s believable “FREE / 0 credits” initial placeholder.
- Use a neutral skeleton until billing truth resolves.
- Distinguish loading, unavailable, free, paid, past-due, cancelled and misconfigured states.
- Explain exactly what consumes credits before checkout and before a scan.
- Show scan eligibility and estimated credit effect next to the scan action.
- Replace “Start Free Hunt” unless a controlled free scan is actually implemented.
- Disable checkout truthfully when production switches or Stripe configuration are unavailable.
- Never show a success screen until the webhook-backed state confirms entitlement.
- Restore checkout status after redirect and show pending verification separately from success.
- Display receipts, support path and consistent refund/dispute wording.
- Remove loot boxes, XP, badges, borders, “Most Popular,” and “Best Value” unless the system fulfills them and the label has evidence.
- Add currency, tax and renewal copy appropriate to the supported market.
- Instrument pricing view, checkout start, checkout return, verified activation, failure and cancellation.

### Acceptance gates

- A paid user never renders as free during loading.
- A free user understands that scanning requires payment before clicking the scan button.
- Checkout cannot begin when the worker or payment release gate is off.
- Payment success is not displayed before verified entitlement.
- Every price and benefit comes from the canonical catalog or a versioned content contract.
- Billing end-to-end tests cover success, cancellation, delayed webhook, duplicate webhook and misconfiguration.

### Expected score after Phases 2–3

81/100. The acquisition-to-payment journey is coherent enough for a tightly controlled paid beta.

---

## Phase 4 — Mobile interaction and responsive information architecture

### Objective

Make every core task usable on a small touch device without hidden actions or layout traps.

### Work

- Replace transform-only sidebar hiding with conditional mounting or `inert` behavior.
- Add focus trap, Escape close, focus restoration, `aria-expanded` and accessible menu names.
- Make Login visible below 640 px.
- Replace hover-only lead actions with persistent or tap-revealed controls.
- Set minimum touch target and spacing budgets for interactive controls.
- Audit narrow layouts at 320, 360, 375, 390 and 430 CSS pixels.
- Collapse or simplify the blog header on narrow phones.
- Prevent fixed overlays from blocking browser chrome or software keyboards.
- Test landscape and 200% browser zoom.
- Ensure forms scroll the focused field above the keyboard.
- Use a single scroll owner for each route and modal.
- Add safe-area support where necessary.
- Define mobile priority: result context and primary action first; decorative statistics last.

### Acceptance gates

- No horizontal overflow in the supported viewport matrix.
- Every action is discoverable without hover.
- All critical targets meet the agreed touch-size budget.
- Opening and closing navigation restores focus correctly.
- Real touch gestures complete landing, onboarding, scan review, billing and settings journeys.

---

## Phase 5 — Accessibility and inclusive interaction system

### Objective

Reach WCAG 2.2 AA for the core paid journey and make accessibility regression-testable.

### Work

- Adopt an accessible dialog primitive for scanner, reply, settings, keys and confirmation modals.
- Add `role="dialog"`, `aria-modal`, labels, descriptions, focus containment and Escape behavior through the shared primitive.
- Add a document-level `<main>` to public pages and eliminate nested main landmarks.
- Add unique route metadata and meaningful document titles.
- Add skip navigation.
- Add labels and descriptions for icon-only controls.
- Make validation errors programmatically associated with fields.
- Add `aria-live` or status semantics to loading and durable-operation updates without producing noisy announcements.
- Implement `prefers-reduced-motion` globally and use reduced-motion-aware Framer behavior.
- Verify color contrast in all interactive, disabled, error and focus states.
- Define consistent visible focus styles.
- Make card actions reachable and visible by keyboard.
- Verify content at 200% and 400% zoom.
- Add automated axe checks and manual keyboard/VoiceOver scripts.

### Acceptance gates

- Zero critical or serious automated accessibility violations on core routes.
- All core journeys pass keyboard-only testing.
- VoiceOver can identify, open, operate and close navigation and dialogs.
- Reduced-motion users receive no unnecessary continuous or entrance animation.
- Focus never moves to hidden or off-screen controls.
- Accessibility failures block release.

### Expected score after Phases 4–5

88/100. The frontend becomes usable rather than merely responsive.

---

## Phase 6 — Server/client architecture and performance budgets

### Objective

Reduce hydration cost, eliminate accidental client ownership and improve real-user speed.

### Work

- Read the installed Next.js version’s documentation before changing routing, caching or Server Component behavior.
- Convert the landing route shell and static sections to Server Components.
- Keep Clerk controls, sound and interactive demos as isolated client islands.
- Remove `ssr: false` from above-the-fold content unless it is technically necessary.
- Avoid hiding acquisition CTAs until Clerk hydration; render a stable server-safe state.
- Parallelize independent server reads.
- Stream independent authenticated sections behind meaningful Suspense boundaries.
- Minimize serialized props and pass view models rather than database entities.
- Import icons and heavy libraries directly; avoid broad barrel imports.
- Defer analytics and nonessential third-party scripts.
- Lazy-load below-the-fold interactive demos using visibility or intent.
- Use `content-visibility` for long off-screen sections or lists where appropriate.
- Virtualize or paginate large opportunity and history lists.
- Optimize images, fonts and background assets with explicit dimensions.
- Eliminate layout-shifting skeletons.
- Measure landing and authenticated bundles before and after each change.

### Performance budgets

- Production p75 LCP: 2.5 seconds or faster.
- Production p75 INP: 200 milliseconds or faster.
- Production p75 CLS: 0.10 or lower.
- No route may regress its measured JavaScript transfer by more than 10% without a recorded exception.
- Establish an initial landing-route JavaScript ceiling after Phase 6 baseline measurement and ratchet it downward.
- No hydration warning, uncaught browser error or failed first-party request on the core journey.

### Acceptance gates

- Landing content and primary CTA are meaningful before client hydration.
- Performance budgets pass in repeatable preview tests and later in production telemetry.
- Bundle analysis identifies no accidental large dependency in the initial route.
- Route-level loading boundaries show truthful structure without fake account data.

---

## Phase 7 — Resilience, observability and supportability

### Objective

Make failures understandable to customers and diagnosable by operators.

### Work

- Add root, route and feature error boundaries with retry behavior.
- Define one customer-safe error vocabulary: validation, authentication, entitlement, payment, provider unavailable, timeout, conflict and internal failure.
- Include a request ID in user-facing support details.
- Add structured frontend error capture with aggressive secret and personal-data redaction.
- Record route, release, operation type, status and duration—not raw sensitive payloads.
- Instrument the canonical funnel:
  - landing viewed;
  - signup started/completed;
  - onboarding completed;
  - keyword persisted;
  - pricing viewed;
  - checkout started/verified;
  - scan queued/terminal;
  - results viewed;
  - result acted on;
  - CRM delivery terminal.
- Add operational dashboards for auth failures, checkout verification delay, scan queue age, provider failure, delivery failure, frontend error rate and Web Vitals.
- Add customer-safe degradation messages when providers, workers, billing or CRM are unavailable.
- Make feedback submission work in-product and attach consented diagnostic context.
- Add a support runbook mapping customer messages and request IDs to logs.
- Do not claim “operational” from an HTTP 200 alone; readiness must include the dependencies used by the journey.

### Acceptance gates

- Every simulated core-flow failure produces a useful customer message and traceable operator signal.
- No secret, token, raw authorization header or unrestricted payload appears in telemetry.
- Alerts route to a real owner and have an acknowledgement path.
- Support can locate a failed scan or checkout using the customer-visible request/run ID.
- Feedback submission persists and shows a confirmed receipt state.

### Expected score after Phases 6–7

94/100. This is the release-candidate architecture checkpoint.

---

## Phase 8 — Automated quality gates and contract protection

### Objective

Make regressions expensive to merge and cheap to detect.

### Test pyramid

#### Unit tests

- View-model transformations.
- Loading/ready/empty/error state reducers.
- Entitlement and CTA decisions.
- Durable-operation transitions.
- Form validation and normalization.
- Analytics event shaping and redaction.

#### Component tests

- Dialog focus and keyboard behavior.
- Sidebar open/close and focus restoration.
- Keyword create/delete reconciliation.
- Billing loading versus verified states.
- Result card touch, keyboard and screen-reader actions.
- Reduced-motion rendering.

#### Contract tests

- Runtime schema compatibility between Server Actions/API responses and clients.
- Stable error envelope.
- Keyword DTO includes persisted ID.
- Scan and delivery status unions are exhaustive.
- Catalog content and checkout payload agree.

#### End-to-end tests

- Public landing to signup.
- Signup to mandatory onboarding.
- Onboarding to persisted keyword.
- Free account sees correct paid-scan explanation.
- Checkout return waits for verified entitlement.
- Paid scan queues, survives refresh and reaches a terminal view.
- Failed scan shows refund truth.
- Results render and can be dismissed or acted on.
- CRM export reaches delivered/dead and can retry when permitted.
- Account deletion and logout return to a safe public state.

#### Visual and device tests

- Desktop and supported mobile screenshots.
- Light/dark mode only if both are officially supported.
- 200% zoom and narrow viewport snapshots.
- Loading, empty, error, unavailable and terminal states.

### CI gates

- Formatting, lint and type checks.
- Unit, component and contract suites.
- Database-backed integration suite.
- End-to-end suite on a preview deployment.
- Automated accessibility suite.
- Bundle and performance budgets.
- Dependency and secret scanning.
- No focused/skipped core tests.
- No production deployment when a P0/P1 test is quarantined.

### Acceptance gates

- Every fixed audit P0/P1 has a regression test.
- Core journey test failures block merge.
- Preview tests use isolated accounts, records and Stripe test mode.
- Test cleanup is idempotent and cannot target production.
- Flaky core tests are treated as failures, not rerun until green indefinitely.

---

## Phase 9 — Design system, content system and final interaction polish

### Objective

Preserve the strong visual identity while making it consistent and maintainable.

### Work

- Convert repeated colors, borders, shadows, radii, spacing, typography and animation values into named tokens.
- Build shared Button, LinkButton, IconButton, Input, Select, Dialog, Toast, Skeleton, Alert, EmptyState and StatusBadge primitives.
- Prevent nested interactive controls such as `<Link><button>`.
- Define consistent disabled, pending, success, warning and destructive states.
- Standardize content terms: keyword, scan, match, opportunity, delivery, credits and subscription.
- Create a product-copy checklist requiring evidence for numerical, comparative and automation claims.
- Keep the neo-brutalist style, but reduce decoration when it competes with task hierarchy.
- Make the primary action unambiguous on every route.
- Remove orphaned and duplicate surfaces.
- Add route-level empty states that teach the next real action.
- Document component APIs and usage examples.
- Add visual regression coverage for primitives and core routes.

### Acceptance gates

- No active duplicate keyword, billing or scan UI.
- New core components use shared accessible primitives.
- No raw brand color or shadow value is added without an approved token exception.
- Product terminology is consistent across UI, auth, billing, email and support.
- Visual regression changes require explicit review.

### Expected score after Phases 8–9

97/100. The implementation is high-quality, but production proof is still required.

---

## Phase 10 — Privacy, security and legal frontend hardening

### Objective

Ensure the browser does not expose secrets, overclaim protection or create avoidable legal risk.

### Work

- Remove raw server exception messages from Server Action results.
- Runtime validate every client-originated action payload.
- Verify authorization at server boundaries; the frontend must never be the security control.
- Add production CSP, HSTS, Permissions-Policy and explicit image-source policy with the backend/security phase.
- Remove development Clerk keys and development-instance warnings from production.
- Audit browser storage; version, minimize and expire persisted client data.
- Never store provider tokens, Stripe secrets or unrestricted personal data in browser storage.
- Redact sensitive query parameters from analytics and error tools.
- Add consent and privacy behavior for analytics where legally required.
- Make account deletion, data export and session termination understandable and recoverable where appropriate.
- Align terms, privacy, billing, cancellation, refunds and support copy.
- Perform dependency, DOM injection and unsafe URL handling review.

### Acceptance gates

- Production browser console has no development-key or deprecated-auth warnings.
- No secret or restricted personal data is accessible in client bundles, browser storage or telemetry.
- Security headers pass the deployment contract.
- Legal and billing language has one approved source.
- Authentication route protection tests cover every private route.

---

## Phase 11 — Production certification and controlled rollout

### Objective

Prove the complete paid journey in a production-like environment, then release gradually.

### Certification matrix

| Journey | Browser | API | Persistence | External system | Terminal UI |
| --- | --- | --- | --- | --- | --- |
| Signup and onboarding | Required | Required | Required | Clerk | Required |
| Keyword management | Required | Required | Required | — | Required |
| Checkout and activation | Required | Required | Required | Stripe | Required |
| Paid scan | Required | Required | Required | Providers + worker | Required |
| Failed scan and refund | Required | Required | Required | Providers + ledger | Required |
| CRM delivery and retry | Required | Required | Required | CRM | Required |
| Support feedback | Required | Required | Required | Notification system | Required |
| Account deletion | Required | Required | Required | Clerk + Stripe where applicable | Required |

### Release steps

1. Freeze schema and public contract changes for certification.
2. Deploy a production-like preview using test-mode external systems.
3. Run the full automated suite.
4. Complete desktop, mobile, keyboard and VoiceOver manual scripts.
5. Rehearse disabled worker, unavailable provider, delayed webhook, exhausted credits, expired session and network interruption.
6. Verify dashboards and alert routing.
7. Rehearse rollback to the last known-good release.
8. Enable a founder/internal cohort.
9. Enable a small invited paid-beta cohort.
10. Expand only when error, conversion and support evidence remain within agreed thresholds.
11. Observe production for a defined stability window.
12. Rescore using production data and document remaining risk.

### Acceptance gates

- No open P0/P1 defects.
- Every certification journey has dated evidence.
- Payment and worker release switches are on only after their dependencies pass readiness.
- Alerts, owner, rollback and customer communication paths are live.
- Real invited users complete the paid journey without operator database intervention.
- Production telemetry shows no unexplained loss between queued and terminal operations.

### Expected score after Phases 10–11

97–100/100. Award 100 only after the production stability window and a final independent audit.

## 7. Phase-pair delivery rules

For every pair—0–1, 2–3, 4–5, 6–7, 8–9 and 10–11—use the same discipline.

### Before implementation

- Recheck Git status and preserve unrelated work.
- Freeze the exact routes, contracts and source ownership for the pair.
- Write acceptance tests before or alongside fixes.
- Record any backend dependency that prevents truthful frontend completion.
- Capture the browser baseline on desktop and mobile.

### During implementation

- Keep one canonical component per capability.
- Make small reviewable patches.
- Do not begin later-phase polish while a current P0/P1 remains.
- Verify every client/server boundary using real response shapes.
- Keep unavailable features unavailable rather than simulating success.

### Before declaring the pair complete

- Run focused tests for changed behavior.
- Run the full lint, type, unit and build gates.
- Run the applicable database-backed contract tests.
- Verify the complete customer story in a browser.
- Test desktop, mobile, keyboard and failure behavior.
- List unrelated baseline failures separately.
- Produce a dated evidence report with files changed, commands, screenshots, known limitations and next pair recommendation.

## 8. Agent execution model

For each phase pair, use bounded ownership to avoid conflicting edits.

| Role | Responsibility |
| --- | --- |
| Lead frontend engineer | Architecture, scope, contract decisions and final integration |
| Route/contract investigator | Trace mounted routes, auth gates, Server Actions, API schemas and state ownership |
| Feature worker | Implement the pair’s core workflow in explicitly owned files |
| Accessibility/mobile worker | Implement and test interaction semantics and device behavior |
| Verification agent | Independently test browser → API → persistence → terminal UI |
| Product-truth reviewer | Reject unsupported claims, fake state and misleading billing language |

Agents must not edit the same files concurrently. The lead resolves integration and runs the final full-story verification.

## 9. Estimated effort

These are engineering ranges, not promises.

| Phase pair | One senior engineer | Two engineers with clear ownership |
| --- | ---: | ---: |
| 0–1 | 8–12 working days | 5–7 working days |
| 2–3 | 8–13 working days | 5–8 working days |
| 4–5 | 8–12 working days | 5–7 working days |
| 6–7 | 10–15 working days | 6–9 working days |
| 8–9 | 10–15 working days | 6–9 working days |
| 10–11 | 8–14 working days plus observation | 5–9 working days plus observation |

Realistic total:

- One senior engineer: roughly 12–17 weeks plus production observation.
- Two engineers plus independent verification: roughly 7–10 weeks plus production observation.
- Backend gaps in scheduling, qualification, rate limits, worker readiness or billing can extend the schedule.

## 10. Initial backlog mapped from the audit

### P0

- Public `/` does not present the product story.
- Signup does not enforce onboarding.
- UI promises monitoring while schedules remain disabled.
- Paid scanning depends on worker and checkout switches that default off.

### P1

- Scan results can remain stale after `router.refresh()`.
- Long scan timeout can leave the scanner visually active.
- Keyword creation invents a client ID.
- CRM deliveries have no customer-facing terminal state.
- Billing renders false free/zero-credit state while loading.
- “Start Free Hunt” conflicts with zero free scans.
- Mobile navigation hides Login.
- Lead dismissal is hover-only.
- Public-looking blog and status links are protected.
- Billing rewards and popularity claims are unsupported.
- Refund language conflicts across surfaces.
- Core dialogs and mobile navigation are inaccessible.
- Motion-heavy UI has no reduced-motion path.

### P2

- Landing has an overly broad client boundary.
- Authenticated navigation contains invalid nested interactive elements.
- Duplicate keyword route is orphaned and has weak error behavior.
- No branded application error boundary exists.
- Landmark nesting and route metadata are inconsistent.
- Blog navigation may overflow narrow devices.
- Support feedback submission is unavailable.
- Development auth warnings and deprecated route-matching behavior remain.

Every item must be linked to a phase, owner, test and acceptance gate before implementation begins.

## 11. Immediate next move: Phases 0–1 only

The first implementation pair should touch only the route/product-truth boundary and core state/durable-operation flow.

### Recommended order

1. Record canonical brand and route decisions.
2. Add route-ownership tests.
3. Make `/` public and place the dashboard under `/app`.
4. Repair public footer destinations.
5. Replace unsupported monitoring/free/reward/refund copy.
6. Return the real persisted keyword DTO.
7. Repair dashboard state reconciliation.
8. Introduce the durable run-status route and timeout recovery.
9. Add CRM delivery status and retry UI.
10. Run full-story desktop/mobile verification.

### Stop condition

Do not begin Phases 2–3 until all Phase 0–1 acceptance gates pass and the score is independently reassessed.
