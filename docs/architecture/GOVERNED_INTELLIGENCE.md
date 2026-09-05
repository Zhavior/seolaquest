# SEOlaQuest governed intelligence backend

Status: implemented locally; production migration and deployment are not performed by this change.

## Product contract

Help a founder choose conversations worth reviewing, show the supporting source and reasoning,
and retain an accurate record of what the customer reports afterward. A heuristic score is not a
conversion probability. A successful classifier request is not proof of correct classification.

This implements the research from “Improve SEOlaQuest Architecture” and “SEOlaQuest Competitor
Watch”: evidence, domain policy, atomic state changes, and outcome memory. It keeps the existing
Next.js modular monolith, PostgreSQL database, transactional outbox, and durable workers.

## Ownership

| Responsibility | Owning code |
| --- | --- |
| Source intake, provider attempts, normalized leads and matches | Leads scan services |
| Business and customer context | Users public business-context reader |
| Immutable intelligence evidence and scoring policy | Aurora |
| Legal customer transitions and outcome journal | LeadOutcomeService and leadTransition |
| Ranked current queue | LeadQueryService |
| Credit and billing authority | Existing Billing services |
| XP and reputation authority | Existing Gamify ledger and eligibility policy |

The queue is an explicit cross-domain SQL read projection, not a second writer or a materialized
copy. Aurora owns its public decision reader; the old Gamify import remains a compatibility export.
No new infrastructure or dependencies are introduced.

## Evidence and recommendation

Each new Aurora decision persists the normalized evaluation input, its SHA-256 fingerprint,
classifier/scorer/policy versions, configured model, evaluation status, reasons and timestamp.
Source and business text are untrusted classifier input. Prompts include the existing onboarding
business description and target customer. New private decision snapshots cascade with their lead.

Policy v2 requires explicit commercial intent, high relevance, known business context, non-low
business fit and at least 0.7 model confidence before ENGAGE can be recommended. Other signals
are capped below the ENGAGE score threshold. These thresholds are conservative heuristics,
not a calibrated prediction model. The provider can still be wrong.

The queue ranks the latest decision for every open lead before limiting to 24. A priority review
requires LIVE v2 evidence, ENGAGE, score at least 80, confidence at least 0.7, and a source timestamp
within the past seven days. Missing, future, old, fallback and older-policy evidence cannot qualify.
Ties have stable ordering. Every returned item includes the decision reference, reasons, observed
and evaluated timestamps and recommendation policy result. The dashboard uses this result and
shows actual reasons rather than generating buying-intent prose from a score.

The fingerprint identifies the stored evaluation context; it is not a signature, an exact provider
wire capture, or proof of an authentic source. Providers do not report a pinned model revision here.

## Current state and immutable outcomes

Commands are owner-scoped, lock the lead, check the request receipt, evaluate legal transitions,
and commit current state plus an immutable outcome record in one transaction.

- CLAIM: NEW or VIEWED to CLAIMED. Does not set contactedAt.
- DISMISS: NEW, VIEWED or CLAIMED to DISMISSED.
- CONTACT: NEW, VIEWED or CLAIMED to CONTACTED.
- REPLY: CONTACTED to REPLIED (the customer reports receiving a reply).
- QUALIFY: CONTACTED or REPLIED to QUALIFIED.
- CONVERT: CONTACTED, REPLIED or QUALIFIED to CONVERTED.

Claims/dismissals are USER_ACTION evidence. Contact/reply/qualification/conversion are explicitly
CUSTOMER_REPORTED. They never issue conversion XP or verified revenue claims. Claim activity
continues through the existing eligibility-controlled Gamify path. A CRM export now emits
lead.crm_exported; legacy CRM_EXPORTED conversion events are excluded by reward and quest rules.
Historical rewards and historical CONTACTED states are not rewritten.

Outcome records bind actor, lead, action, decision, previous/resulting state, domain policy and
reasons, optional notes, timestamp and idempotency receipt. A key replay returns the original
receipt; reuse for different parameters is a conflict. The optional decisionId binds a displayed
recommendation; if omitted, the latest decision at command time is recorded as context.
This does not prove the user saw or followed that recommendation.

Database checks enforce valid transition shapes, evidence labels, fingerprints and reference
ownership. Journal updates are rejected except clearing a deleted decision FK. Cascading privacy
deletion remains possible. This is append-only application history, not a tamper-proof archive
against a privileged database operator.

## API

GET /api/v1/leads/:id/outcomes returns the tenant-owned current state and up to 100 journal entries.
An empty journal is explicitly NO_RECORDED_TRANSITION; historical status alone is not outcome proof.
POST to the same URL requires an Idempotency-Key header (8–128 alphanumeric, underscore or hyphen
characters) and a JSON body with action, optional decisionId, and optional notes (at most 1000 chars).
The session supplies the actor. Client-supplied evidence kinds or policy results are rejected.
The existing dashboard claim/dismiss actions use the same domain command.

The dashboard links to /app/leads for customer-reported contact, reply, qualification and conversion
controls. The page shows the newest 50 tracked leads and their latest 10 outcomes, scoped to the
session owner. Controls retain their idempotency receipt on uncertain saves and refresh after success.
Outcomes are stored for evaluation, not automatically used to retrain or change
scoring weights. A labeled customer evaluation set is required before claiming improved accuracy.

## Mechanical checks

The standard test suite checks critical Prisma write ownership and the new backend/UI boundary.
The pre-existing ScanRunService credit writer is explicitly grandfathered; this is not a claim
that every existing module is fully decoupled. Raw SQL outside the governed slice and whole-repo
cycle elimination remain outside this gate.

The Verify workflow adds disposable PostgreSQL migration and integration tests for ranking,
tenant isolation, decision provenance, concurrent replay, rollback, outcome truth and deletion.
No customer credentials are needed. Run these locally only with a disposable loopback database,
GOVERNED_INTEGRATION_TEST=true and explicit DATABASE_URL/DIRECT_URL overrides.

## Adoption and remaining sales proof

Apply the forward migration to a restored preview first, then deploy this code. Do not run new
code against the old schema. Keep workers stopped across the preview migration/deploy boundary.
Existing decisions remain immutable; new scans use classifier v2/policy v2. This change does not
replay historical scans, charge existing customers for reevaluation, or reinterpret old contacts.
Conversion quests relying on verified lead.converted events will not advance on CRM exports or
customer reports; hide or revise that catalog before offering those quests commercially.

Before a paid launch, prove the mounted authenticated customer journey, real provider coverage and
cost, Stripe reconciliation, backup restoration and operational alerts. The previous Phase 7
runbook still applies. Passing local tests is not evidence of production operation or product fit.


## Owner Admin Mode

The owner workspace is /app/admin with Overview, Users, Operations, and Aurora evidence pages.
Only the verified primary Clerk address zhavior@gmail.com is accepted, and its Clerk user ID must
match the current application session. Local database email, secondary/unverified addresses,
client-side flags and the previous Aurora environment allowlist do not grant access. The app
renders an Admin Mode entry only after the owner check. Every service and mutation reauthorizes.

Counts and search use database records; no MRR, active-user or conversion claims are fabricated.
The Users page shows 25 users per page with plan, subscription status, remaining credits, matches
and onboarding state. Operations shows provider outcomes, worker failures, decision versions,
customer-reported outcome counts and the latest owner audit records without exposing provider
payloads or credentials. Pausing a scan schedule uses the Leads domain service and commits its
owner audit in the same transaction. It does not cancel already accepted scans or enable new
credit consumption. Additional destructive/billing powers are not included in this release.

## Local verification receipt

Completed September 4, 2026 (Halifax): 902 tests passed in the full suite (25 skipped),
plus seven enabled disposable PostgreSQL integration checks. The final admin page check
passed all four cases after the page-level gate was added. Lint, TypeScript, Prisma validation,
production build and prerendered-route bundle budgets passed.

A baseline-to-current migration rehearsal preserved legacy credits, CONTACTED status and
v1 decision provenance without inventing outcome records. Desktop and 390px mobile static
renders of the actual admin components were inspected with explicitly labeled empty fixtures;
mobile had no horizontal overflow. This is not an authenticated browser session or live data.

No live migration, deployment, provider run or owner-session browser verification was performed.
The bundle gate does not measure authenticated /app routes.

## Follow-up connection verification — September 5, 2026

27 focused API, UI, admin, dashboard-hook and boundary checks passed; seven PostgreSQL
checks passed with added assertions for follow-up history and tenant isolation. Scoped lint
and TypeScript passed. The production build passed and includes /app/leads. Existing workspace design changes were preserved.

The earlier live smoke pass found X search working, Reddit returning HTTP 403 from this machine,
Gemini 2.5 Flash generation rejected as unavailable to this account, and the configured Founder
Stripe price absent under the available live key. The Beta price existed; Pro and Agency are
disabled. Production readiness rejected the available operations secret. These external
configuration and provider issues remain unresolved by connecting the follow-up UI.

Full mounted authenticated owner and customer journeys remain unverified. No live migration,
deployment, payment, model switch or provider bypass was performed.
