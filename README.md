# SEOlaQuest

[![Accessibility](https://github.com/Zhavior/seolaquest/actions/workflows/accessibility.yml/badge.svg)](https://github.com/Zhavior/seolaquest/actions/workflows/accessibility.yml)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

**Find real buyer pain before you build the wrong thing.**

SEOlaQuest watches public conversations on X for the keywords that matter to your business and collects every match in a dashboard, with the original post attached, so you can read what people actually said instead of guessing. It's customer research for founders and operators who'd rather work from evidence than hunches.

🔗 **Live at [seolaquest.com](https://seolaquest.com)**

![The SEOlaQuest landing page](docs/media/landing.png)

---

## For people evaluating this as a product

**The problem.** You have a hunch about what your customers want. Validating it means trawling social feeds by hand, or paying for a listening tool built for enterprise brand monitoring that costs more than your runway.

**What SEOlaQuest does.**

1. You tell it which keywords and phrases to watch.
2. Scheduled scans sweep X for posts matching those phrases.
3. Matches land in your dashboard with the author, the full text, and a link to the original post.
4. You triage them yourself — claim, contact, or dismiss.
5. Anything worth keeping can be pushed to your CRM via webhook.

**Things it deliberately does not do.** It won't post, send, or DM on your behalf. It won't show you demo data dressed up as real results — if a provider is down, you get an honest "unavailable" instead of filler. And it won't hand you a confidence score it hasn't earned: a match is a keyword match, presented as a signal for you to judge, never as a verified sales lead. The empty states in the app say so in as many words.

The interface is built as a gamified RPG-style console — keywords are quests, scan credits are Mana, the dashboard is your guild hall. That's a deliberate product bet: research tools are tedious, and tedious tools go unused.

Reddit scanning is implemented in the codebase but not yet switched on.

---

## For people evaluating this as engineering work

A full-stack SaaS application, built solo. Not a tutorial project or a CRUD demo — it has real billing, real webhooks, a durable background job system, and a security posture that assumes hostile input.

### Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom neo-brutalist design system with multi-theme tokens |
| Data | PostgreSQL via Prisma, 19 models, versioned migrations |
| Auth | Clerk sessions plus server-side tenant authorization |
| Billing | Stripe Checkout, signed webhooks, credit ledger |
| AI | Google Gemini for the in-app assistant and blog content generation |
| Infra | Vercel, Upstash Redis for rate limiting, cron-driven job runner |
| Graphics | PixiJS and react-three-fiber for the world map and battle canvas |
| Testing | Vitest, Testing Library, axe-core accessibility gate |

### Engineering decisions worth a look

**SSRF defense on user-supplied webhook URLs** — [`crmWebhookRequest.ts`](src/modules/core/security/crmWebhookRequest.ts), [`crmWebhookUrl.ts`](src/modules/core/security/crmWebhookUrl.ts)

Users can point CRM delivery at any URL, which is a server-side request forgery invitation. The naive fix — validate the URL, then fetch it — loses to DNS rebinding, because the hostname can resolve differently between the check and the request. So the address is resolved once, every returned address is checked against blocklists covering RFC 1918 space, loopback, link-local, carrier-grade NAT, and the IPv6 equivalents, and then the verified addresses are **pinned into the request's own DNS lookup**. There is no window where the hostname can point somewhere else.

**Money that survives retries** — `CreditLedgerEntry`, `StripeWebhookEvent`, `CheckoutIntent`

Stripe delivers webhooks at least once, sometimes more. Credits are applied through an append-only ledger keyed on the Stripe event, so a replayed webhook is recorded and ignored rather than granting the credits twice. Checkout uses a server-held price ID; a browser-supplied one is rejected.

**Durable background work with lease-based claiming** — `DurableJob`, [`/api/v1/cron/jobs`](app/api/v1/cron/jobs/route.ts)

Scans are long-running and providers fail, so work is enqueued as durable job rows drained by a per-minute Vercel cron. Each job carries a unique `dedupeKey` so the same work can't be queued twice, an attempt counter with a `nextAttemptAt` backoff, and a `leaseOwner` / `leaseGeneration` / `leaseExpiresAt` triple. The lease is the interesting part: a worker claims a job for a bounded window, so if an invocation dies mid-job the lease simply expires and the work is reclaimed — without a second worker ever running it concurrently. Jobs that exhaust `maxAttempts` are marked `deadAt` rather than silently dropped, and an ops endpoint behind a bearer secret reports the counts.

**Modular architecture** — `src/modules/<domain>/{domain,application,infrastructure}`

Business logic lives in `src/modules`, separated from the Next.js route layer, split by domain (billing, leads, keywords, lifecycle, progression, operations). Routes stay thin; domain rules are unit-testable without a running server.

**Accessibility as a build gate** — [`scripts/phase-5-accessibility-gate.mjs`](scripts/phase-5-accessibility-gate.mjs)

`npm run test:a11y` builds and boots a real production server, drives headless Chromium across every public route, and fails on axe-core violations. It runs in GitHub Actions on every pull request and every push to `main` — accessibility is enforced by CI, not by good intentions.

**Test suite** — 112 files covering domain logic, API handlers, webhook idempotency, SSRF rejection, and component rendering. 620 passing, 6 currently failing: the UI progression tests assert an XP/Mana display format the status bar no longer renders, and one auth test still expects a throw that [7154cc7](https://github.com/Zhavior/seolaquest/commit/7154cc7) deliberately removed. Listed here rather than hidden, because a README that claims a green suite you can check in thirty seconds is worse than no README.

---

## Project status

This is an honest section, because overstated production claims are easy to check.

**Working and deployed:** authentication, keyword tracking, X scanning, the lead dashboard and triage flow, Stripe checkout and webhook processing, CRM webhook delivery, the durable job runner, the Gemini-backed assistant and blog generator.

**Not yet done:** a database backup and restore rehearsal, a signed Stripe sandbox replay against the deployed preview, published uptime and latency objectives, runtime rate limiting and operational alerting, and verified end-to-end account deletion across every downstream system.

No uptime SLA is offered, and none is claimed. The app publishes this same status at [seolaquest.com/specs](https://seolaquest.com/specs).

---

## Running it locally

Requires Node.js 20 or newer (CI runs 22), a PostgreSQL database, and a Clerk account. Stripe, Gemini, X API, and Upstash credentials are optional — the features that need them degrade to unavailable rather than crashing.

```bash
git clone https://github.com/Zhavior/seolaquest.git
cd seolaquest
npm install
```

Copy `.env.example` to `.env.local` and fill in the values. The minimum needed to boot:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/seolaquest
DIRECT_URL=postgresql://user:password@localhost:5432/seolaquest

# Auth (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Optional — features degrade cleanly without these
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BETA=price_...
GEMINI_API_KEY=...
TWITTER_BEARER_TOKEN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

`.env.example` has the complete list, including the feature flags (`ENABLE_SCAN_WORKER`, `SUBSCRIPTION_CHECKOUT_ENABLED`, `DURABLE_WORKER_ENABLED`) that gate the billing and scanning paths — they default to off.

Then migrate and start:

```bash
npm run db:migrate
npm run dev
```

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm test` | Run the Vitest suite |
| `npm run test:a11y` | Run the axe-core accessibility gate |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm run db:studio` | Browse the database in Prisma Studio |

---

## Repository layout

```
app/              Next.js App Router — routes, API handlers, layouts
  api/v1/         Versioned public API (scans, keywords, webhooks, health)
src/modules/      Domain logic by bounded context
  billing/        Stripe, credit ledger, entitlements
  leads/          Scan orchestration, provider calls, CRM delivery
  core/security/  SSRF guards, rate limiting, auth helpers
  operations/     Durable jobs, heartbeats, dead letters
components/       Shared UI and the app shell
features/         Feature-scoped components (landing, dashboard, blog, guild)
content/posts/    MDX blog content
prisma/           Schema and migrations
docs/             Architecture notes and operational runbooks
tests/            Accessibility route manifest and fixtures
```

---

## Contact

Built by [@Zhavior](https://github.com/Zhavior). Open to opportunities — reach me through GitHub or at the email on my profile.
