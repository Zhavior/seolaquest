# CoQuest customer feature inventory

Updated: 2026-08-01

This inventory controls customer-visible claims for the Phase 0–5 private-beta checkpoint. A feature moves categories only after its complete browser → server → persistence → provider → terminal UI path is verified.

## Live in the application

- Public landing, pricing, status, legal, authentication, and explicitly published blog routes.
- Clerk-protected `/app` namespace and mandatory, resumable first-keyword onboarding gate.
- Tenant-scoped persisted keywords with database-owned IDs.
- Server-verified billing state, scan eligibility, checkout return truth, and worker/payment-gated checkout availability.
- Manual scan acceptance, durable run IDs, status/history views, and recorded refund state.
- Stored source-match review.
- Durable CRM delivery status and backend-gated retry.

## Private beta or configuration-dependent

- Reddit provider scans: available only when provider credentials and the worker are configured.
- Twitter source coverage: available only when its provider credential is configured.
- Stripe subscription checkout: available only when release gates, catalog, webhook, and worker readiness are verified.
- AI reply drafting and CRM export: require active entitlement and configured providers/destinations.

## Unavailable and excluded from primary navigation

- Automatic or scheduled keyword monitoring.
- Automated customer outreach.
- Free scans (free accounts currently receive zero scans).
- Credit top-ups, Pro, and Agency purchasing.
- Email digests and browser alerts.
- Public customer leaderboards, customer case studies, conversion claims, and revenue attribution.
- Qualified-intent claims, ranking confidence, and outcome-driven model learning.
- In-product bug/feedback submission.

## Internal operations

- Health, readiness, cron worker, webhook, and dead-letter endpoints.
- Provider diagnostics and internal error codes.
- Migration and release-readiness evidence.

Internal operations are not customer features and must not be promoted as product availability.
