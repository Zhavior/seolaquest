# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: SaaS founders and solo operators (confirmed 2026-09-29). They ship product, do their own marketing, and cannot afford a manual search habit. Their scene: a laptop or phone in the gaps between shipping and support, already on X, already annoyed that the people asking for what they sell are buried in the timeline. Job: find public X posts where someone has the problem the founder solves (or complains about a competitor), read the source post, decide whether to engage, and repeat daily without it becoming a chore.

Not confirmed as audiences: agencies, freelancers, local businesses, enterprise sales teams.

## Product Purpose

SEOlaQuest watches X for the keywords a founder tracks, scores matching public posts for buyer intent (deterministic scorer plus a semantic classifier), and delivers them to a lead inbox with the source post attached. A gamified layer (quests, XP, level, hunting streak, "mana" scan credits) turns the daily loop into a habit: discover, inspect the evidence, take a supported action, claim progress. Landing promise chosen by the owner: **find buyers on X**.

Success for the marketing site: a founder understands the loop in seconds, tries the labelled sample, and creates a free account. Success for the business is UNKNOWN: revenue, paying customers, traffic and activation have never been measured.

## Positioning

Comparable tools (F5Bot, Syften, Octolens and similar) are plain keyword-alert dashboards. SEOlaQuest's claim a neighbour could not copy: the hunt is a quest loop where progress is earned only by real, verified actions (never by scanning, never by self-reported sales), and every lead shows its source post before you act. Evidence first, game second.

## Operating Context

- Authed product lives at `/app` (Battle Area, Quest Log = keywords, Leads, Quest Board, Scan Runs, Guild Hall, Deliveries, Profile, Billing "Bazaar & Supplies", Settings). Out of scope for this redesign pass.
- Signup: Clerk `<SignIn/>` / `<SignUp/>` then a custom 6-step onboarding "tutorial quest" (name your hunter, declare your trade, mark your quarry, equip your first weapon = first keyword, choose your hunting ground = X, sign the contract).
- Public site is on Cloudflare Workers via OpenNext; Next.js 16 App Router, Tailwind v4, `next/font`. `middleware.ts` `PUBLIC_ROUTE_PATTERNS` is the allowlist: any new public route must be added there.
- CI gate `tests/accessibility/public-routes.json` pins the `<title>` and a `main` landmark for `/`, `/pricing`, `/blog`, `/status`, `/privacy`, `/terms`, `/api-terms`, `/sign-in`, `/sign-up`.

## Capabilities and Constraints

Real, from code (verified 2026-09-29 by inventory):
- Scans are X only. Reddit is coded but switched off. Say "Reddit soon" at most.
- One scan costs 1 credit ("mana", stored as `User.questsRemaining`). Scanning needs a paid plan and at least 1 credit. Free Scout ($0, 0 credits) can save keywords only.
- Plans: Free Scout $0; Beta Hunter $14.99/mo, 1,500 credits per paid invoice; Founder Pass $29.99/mo, 3,000 credits, price locked for life, 50 seats (live count via `FounderSeatService.snapshot()`); Pro Hunter and Agency Hunter are "coming soon" with no entitlement. Credit top-ups are $5/1,000, $10/2,500, $20/6,000 and gated off.
- **Checkout may be closed.** Owner-recorded state (2026-08-11): checkout flags unset in production, so a paid click ends in "No charge was made." Pricing UI must derive its call to action from the catalog/enabled state and never promise a purchase that cannot complete.
- XP is paid only for: `opportunity.engaged` 25 XP (needs Aurora WATCH/ENGAGE, score at least 60), `aurora.feedback.recorded` 5 XP. Discovery and scanning pay 0 XP. Caps: 500 XP per UTC day, one award per target. Reporting a reply or sale earns no XP.
- Level curve: cumulative XP for level L = round(100 x (L-1)^1.5): L2 100, L3 283, L4 520, L5 800, L10 2,700. No level names or rank ladder exist; default title is "Lead Hunter". (The 50-tier "Monster" ladder in `lib/monsterTiers.ts` is dead code; never market it.)
- Quests enabled: First lead saved (onboarding, 50 XP), Daily Patrol (3 claims, 40 XP), Weekly Sweep (15 claims, 150 XP), Field Veteran (50 claims, 500 XP). Disabled until verified conversion evidence exists: First Blood, Weekly Closer, Rainmaker.
- Hunting streak = consecutive UTC days with at least one claimed or dismissed lead; pays nothing. Four achievements: First Blood, Bounty Hunter, Archmage, Exporter.
- Max 10 active keywords per account. Scheduled scanning foundation runs on a 24h interval but whether it is switched on per user is inconsistent: do not claim "automatic" or "real-time" monitoring.
- Actions after a lead: AI reply draft, CRM webhook export (paid).
- Guild is a private activity journal, NOT multiplayer. No leaderboards, rankings, alliances, or other hunters exist. Guild stats conversion rate, mana efficiency, scout speed are not measured: never advertise them.
- The only unauthenticated public data: `FounderSeatService.snapshot()`, static plan/quest/level catalogs, MDX blog posts (3 published), `GET /api/v1/health/live`.
- No public SLA, uptime objective, or open API. `/status` is a code-status document, not a live status page.
- Homepage OAuth disclosure claims SEOlaQuest "stores OAuth tokens" when X is connected; the Prisma schema has no such fields and posting uses env-level credentials. Do not repeat that claim without verification.

## Brand Commitments

- Name: SEOlaQuest. Theme: Quest, gamified (owner: "the theme is Quest and is gamified").
- Existing lore vocabulary already in the product and onboarding: hunter, quarry, mana, quests, guild hall, armory, bazaar, potions. Keep it where it is true to a real feature.
- Voice rules (owner standing rules): mark unknowns UNKNOWN; never invent numbers, customers, deadlines, traffic or outcomes; label sample data as sample; known-unfixed problems get named rather than omitted; blog benchmark figures are industry orientation, never SEOlaQuest results.
- Earlier design direction (handoff doc, 2026-09-04): keep quest identity, levels, emblems and rewards; the next useful action must dominate; premium comes from hierarchy, evidence quality and reliable interaction. This is background, not a binding visual constraint for the redesign.
- Rejected earlier: fabricated logos, outcomes, live activity, rankings, integrations.

## Evidence on Hand

- No testimonials, customer logos, case studies, press, revenue, traffic or conversion figures exist. Do not fabricate any. Social proof sections must be replaced by mechanism proof (real product screens, the labelled sample, real catalogs).
- Real, usable material: plan and quest catalogs (see above), the `SAMPLE_TARGETS` radar sample (invented, must stay labelled), the level curve, 3 published blog posts, icon sprites in `public/icons`, the live founder seat count.
- Live site inspected 2026-09-29: hero "Find customer pain. Choose your next move." with a labelled sample card; long "App transparency" data-disclosure block on the homepage.

## Product Principles

1. Evidence before action: a match is not a customer. Every lead shows its source post before the user acts.
2. Progress is earned, not decorated: XP, levels and quests reflect real, verified actions only. Never imply scanning or a self-reported sale earns XP.
3. The game serves the daily loop (discover, inspect, engage, claim), not the other way round. If the game layer hides the next useful action, cut it.
4. Say what exists today: X only, paid scans, checkout state, Reddit not live, no leaderboards. Unavailable things are named, not hidden.
5. A first-time founder reaches a real next step (sample, free account) without paying, without confusion.

## Accessibility & Inclusion

- Owner works with ADHD: explanations plain, next action obvious.
- Public routes must keep passing the axe gate (WCAG 2.1 AA) in the themes shipped; 44px touch targets; pinch-zoom enabled; `prefers-reduced-motion` honored with a real static fallback; sound must never autoplay and defaults off.
