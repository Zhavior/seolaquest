# SEOlaQuest

[![Accessibility](https://github.com/Zhavior/seolaquest/actions/workflows/accessibility.yml/badge.svg)](https://github.com/Zhavior/seolaquest/actions/workflows/accessibility.yml)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

**Be the source the answer cites.**

When a buyer asks an AI search engine which tool to use, the answer cites a handful of sites. SEOlaQuest asks that question for you, lists every source the answer used, sorts them into forums, review sites, articles and vendor pages, and shows whether your site made it in. This is often called GEO, generative engine optimization.

🔗 **Live at [seolaquest.com](https://seolaquest.com)** — early access, free to join.

![The SEOlaQuest landing page](docs/media/landing.jpg)

---

## For people evaluating this as a product

**Where it stands today.** Early access. The GEO scan is built and tested in code but not switched on: no real scan has run, so nothing on the site comes from an engine, and the sample scan on the landing page is labelled as invented. Joining is free and needs no card. Nothing on the site is for sale.

**How a scan works.**

1. **Ask.** You type a question your buyers ask and the site you want named. SEOlaQuest puts the question to Perplexity, the only engine for now.
2. **Read.** You see every page the search found and every page the answer cited, in order. "Found but not cited" is its own result.
3. **Sort.** Each source is classified as a forum, a review site, an article or a vendor page. Sites the rules don't recognise are marked as a guess, not passed off as known.
4. **Act.** Each type points to a different move: answer the thread, get listed, pitch the writer, or fix your own page. SEOlaQuest shows the map; you do the work.

**Things it deliberately does not do.** It doesn't promise a citation: an answer is a snapshot, and the same question can cite different sources tomorrow. It covers one engine, Perplexity; ChatGPT, Gemini and Google AI answers are not covered. Scans run when you start them; there is no scheduled monitoring. And there is no price yet, because every scan records what the engine charged and no real scan has produced that number.

**The earlier product.** SEOlaQuest started as an X lead finder: watch keywords on X, collect matching posts in a dashboard, triage them, and push the keepers to a CRM by webhook. It still runs inside the app for signed-in accounts, its paid checkout is paused, and most of the engineering below was built for it. Reddit scanning is implemented in the codebase but not switched on.

The public site is styled as a quest — a game manual for founders. That's a deliberate bet: research tools are tedious, and tedious tools go unused.

---

## For people evaluating this as engineering work

A full-stack SaaS application, built solo. Not a tutorial project or a CRUD demo — it has real billing, real webhooks, a durable background job system, and a security posture that assumes hostile input.

### Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom design tokens (the Dusk palette on the public site) |
| Data | PostgreSQL via Prisma, 32 models, versioned migrations |
| Auth | Clerk sessions plus server-side tenant authorization |
| Billing | Stripe Checkout, signed webhooks, credit ledger |
| AI | Perplexity for GEO citation scans (off by default), Google Gemini for the in-app assistant and blog content generation |
| Infra | Cloudflare Workers via OpenNext (`wrangler.jsonc`), Upstash Redis for rate limiting, durable job runner |
| Graphics | three.js for the valley scene on the home page, sample radar and dashboard |
| Testing | Vitest, Testing Library, axe-core accessibility gate |

### Engineering decisions worth a look

**SSRF defense on user-supplied webhook URLs** — [`crmWebhookRequest.ts`](src/modules/core/security/crmWebhookRequest.ts), [`crmWebhookUrl.ts`](src/modules/core/security/crmWebhookUrl.ts)

Users can point CRM delivery at any URL, which is a server-side request forgery invitation. The naive fix — validate the URL, then fetch it — loses to DNS rebinding, because the hostname can resolve differently between the check and the request. So the address is resolved once, every returned address is checked against blocklists covering RFC 1918 space, loopback, link-local, carrier-grade NAT, and the IPv6 equivalents, and then the verified addresses are **pinned into the request's own DNS lookup**. There is no window where the hostname can point somewhere else.

**Money that survives retries** — `CreditLedgerEntry`, `StripeWebhookEvent`, `CheckoutIntent`

Stripe delivers webhooks at least once, sometimes more. Credits are applied through an append-only ledger keyed on the Stripe event, so a replayed webhook is recorded and ignored rather than granting the credits twice. Checkout uses a server-held price ID; a browser-supplied one is rejected.

**Durable background work with lease-based claiming** — `DurableJob`, [`/api/v1/cron/jobs`](app/api/v1/cron/jobs/route.ts)

Scans are long-running and providers fail, so work is enqueued as durable job rows drained by a cron endpoint. (That endpoint was called every minute by a Vercel cron; since the move to Cloudflare Workers no schedule is configured in this repo, so this is listed under *Not yet done* below.) Each job carries a unique `dedupeKey` so the same work can't be queued twice, an attempt counter with a `nextAttemptAt` backoff, and a `leaseOwner` / `leaseGeneration` / `leaseExpiresAt` triple. The lease is the interesting part: a worker claims a job for a bounded window, so if an invocation dies mid-job the lease simply expires and the work is reclaimed — without a second worker ever running it concurrently. Jobs that exhaust `maxAttempts` are marked `deadAt` rather than silently dropped, and an ops endpoint behind a bearer secret reports the counts.

**Modular architecture** — `src/modules/<domain>/{domain,application,infrastructure}`

Business logic lives in `src/modules`, separated from the Next.js route layer, split by domain (billing, geo, leads, keywords, lifecycle, progression, operations). Routes stay thin; domain rules are unit-testable without a running server.

**A GEO scan that admits what it doesn't know** — [`GeoScanService.ts`](src/modules/geo/application/GeoScanService.ts), [`sourceType.ts`](src/modules/geo/domain/sourceType.ts)

Every cited URL is classified as a forum, review site, article or vendor page from a short hand-picked list of domains and URL patterns. Anything unrecognised falls through with `basis: 'FALLBACK'`, so the UI can show a guess as a guess instead of trusting it like a known match. Each scan stores what the engine charged, because pricing is waiting on that number. The whole path is off unless `GEO_SCAN_ENABLED=true` and `PERPLEXITY_API_KEY` are both set, and each account is capped at 20 scans per rolling 24 hours as a cost guard.

**Accessibility as a build gate** — [`scripts/phase-5-accessibility-gate.mjs`](scripts/phase-5-accessibility-gate.mjs)

`npm run test:a11y` builds and boots a real production server, drives headless Chromium across every public route, and fails on axe-core violations. It runs in GitHub Actions on every pull request and every push to `main` — accessibility is enforced by CI, not by good intentions.

**Test suite** — 171 test files covering domain logic, API handlers, webhook idempotency, SSRF rejection, and component rendering. CI runs the suite on every push and pull request; see the badge above for the current result.

---

## Project status

This is an honest section, because overstated production claims are easy to check.

**Working and deployed:** the public early-access site, authentication, and the earlier X lead finder: keyword tracking, X scanning, the lead dashboard and triage flow, Stripe checkout and webhook processing, CRM webhook delivery, the durable job runner's code and endpoint, the Gemini-backed assistant.

**Not yet done:** a first real GEO scan and its measured cost per scan, applying the GEO database table to production, showing blog posts on the live site (the blog page loads but lists no posts, because [`lib/blog.ts`](lib/blog.ts) reads them from disk at runtime and Cloudflare Workers has no filesystem), a per-minute schedule for the job runner on Cloudflare Workers (the old one lived in `vercel.json` and does not run there), a database backup and restore rehearsal, a signed Stripe sandbox replay against the deployed preview, published uptime and latency objectives, runtime rate limiting and operational alerting, and verified end-to-end account deletion across every downstream system.

No uptime SLA is offered, and none is claimed. The app publishes this same status at [seolaquest.com/status](https://seolaquest.com/status).

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
  geo/            GEO citation scan: Perplexity client, source sorting, cost record
  leads/          X lead finder: scan orchestration, provider calls, CRM delivery
  core/security/  SSRF guards, rate limiting, auth helpers
  operations/     Durable jobs, heartbeats, dead letters
components/       Shared UI and the app shell
features/         Feature-scoped components (handbook public site, dashboard, blog, guild)
content/posts/    MDX blog content
prisma/           Schema and migrations
docs/             Architecture notes and operational runbooks
tests/            Accessibility route manifest and fixtures
```

---

## License

All rights reserved. The source is public so it can be read and evaluated; it is not open source. See [LICENSE](LICENSE).

---

## Contact

Built by [@Zhavior](https://github.com/Zhavior). Open to opportunities — reach me through GitHub or at the email on my profile.
