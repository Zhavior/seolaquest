import Link from 'next/link'
import {
  Eye,
  Lock,
  Monitor,
  Radar,
  ShieldCheck,
  Sword,
  UserRound,
  Zap,
} from 'lucide-react'

const WHAT_IT_DOES = [
  {
    icon: Radar,
    title: 'Monitors public conversations',
    body: 'SEOlaQuest scans publicly visible posts on X (Twitter) for the keywords and phrases you configure. Reddit reading is built but not switched on yet, so nothing is scanned there today. Only publicly accessible content is read — no private messages, DMs, or restricted posts.',
  },
  {
    icon: Zap,
    title: 'Flags potential customer signals',
    body: 'AI agents classify each matching post and score it for buyer intent, pain-point relevance, and urgency. High-confidence matches land in your lead inbox so you can respond first.',
  },
  {
    icon: Monitor,
    title: 'Delivers leads to your dashboard',
    body: 'Every scored match is delivered to your Command Center with the source post, platform, timestamp, and confidence notes — so you can review evidence before taking action.',
  },
]

const DATA_REQUESTED = [
  {
    icon: UserRound,
    label: 'Account identity',
    purpose:
      'Your email address and display name are used to create and identify your account. We store these to associate your keyword settings, scan history, and billing state with your login.',
  },
  {
    icon: Lock,
    label: 'Authentication tokens',
    purpose:
      'When you connect X (Twitter) to reply to matched posts, SEOlaQuest stores OAuth tokens on your behalf. These are used solely to submit replies you authorise inside the app — we never post automatically without your action.',
  },
  {
    icon: ShieldCheck,
    label: 'Billing state',
    purpose:
      'Stripe handles your payment details. SEOlaQuest stores only Stripe identifiers and subscription state — never raw card numbers. Mana credit balances are tracked so usage limits stay accurate.',
  },
  {
    icon: Eye,
    label: 'Product activity',
    purpose:
      'Tracked keywords, configured intent signals, scan results, and lead workflow state are stored so the app works across sessions. This data is scoped entirely to your account.',
  },
]

export function HomepageOAuthDisclosure() {
  return (
    <section
      id="app-transparency"
      className="relative z-10 border-t border-outline bg-canvas px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="transparency-heading"
    >
      <div className="mx-auto max-w-7xl">

        {/* ── Section header ─────────────────────────────────── */}
      <div className="mb-12">
          <span className="inline-flex items-center gap-2 rounded-[20px] border border-outline bg-forest px-4 py-1.5 text-xs font-semibold tracking-wide text-on-forest">
            <ShieldCheck size={14} /> App transparency
          </span>
          <h2
            id="transparency-heading"
      className="font-display mt-4 text-3xl font-medium leading-none tracking-tight text-ink sm:text-5xl"
          >
            What SEOlaQuest is,<br />
            <span className="text-forest">what it does, and why.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-ink-muted">
            This section exists so you can make an informed decision before creating an account.
            No inflated claims, no hidden data practices.
          </p>
        </div>

        {/* ── App identity card ──────────────────────────────── */}
      <div className="mb-10 flex flex-col gap-4 rounded-[20px] border border-outline bg-forest p-6 text-on-forest sm:p-8 md:flex-row md:items-start md:gap-8">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-outline bg-accent">
            <Sword className="h-8 w-8 text-on-accent" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-accent">Application identity</p>
            <h3 className="font-display mt-1 text-2xl font-medium text-on-forest">SEOlaQuest</h3>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-on-forest/80">
              SEOlaQuest is an AI-powered social listening and lead monitoring platform built for founders and operators.
              It monitors X (Twitter) for your tracked keywords in real time, uses AI agents to classify and score
              matching public posts for buyer intent, and delivers qualified leads directly to your dashboard —
              so you can reach potential customers before your competitors do.
            </p>
          <p className="mt-3 text-xs font-semibold text-on-forest/75">
              Built by the SEOlaQuest team · Version 1.0
            </p>
          </div>
        </div>

        {/* ── What the app does ──────────────────────────────── */}
      <div className="mb-10">
          <h3 className="font-display mb-6 text-xl font-medium tracking-tight text-ink">
            App functionality
          </h3>
      <div className="grid gap-5 md:grid-cols-3">
            {WHAT_IT_DOES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
      className="flex flex-col gap-4 rounded-[20px] border border-outline bg-card p-6"
              >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-outline bg-accent">
                  <Icon className="h-6 w-6 text-on-accent" />
                </div>
                <h4 className="text-lg font-semibold text-ink">{title}</h4>
                <p className="text-sm font-medium leading-relaxed text-ink-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* ── Data transparency ──────────────────────────────── */}
      <div className="mb-10">
      <div className="mb-6 flex items-start gap-3">
      <div className="rounded-[20px] border border-outline bg-highlight p-2">
              <Eye className="h-5 w-5 text-on-accent" />
            </div>
            <div>
          <h3 className="font-display text-xl font-medium tracking-tight text-ink">
                Why we request your data
              </h3>
          <p className="mt-1 text-sm font-medium text-ink-muted">
                A plain-language breakdown of every data category the app collects and what it is used for.
              </p>
            </div>
          </div>

      <div className="grid gap-5 md:grid-cols-2">
            {DATA_REQUESTED.map(({ icon: Icon, label, purpose }) => (
              <div
                key={label}
      className="flex gap-4 rounded-[20px] border border-outline bg-card p-6"
              >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[20px] border border-outline bg-highlight">
                  <Icon className="h-5 w-5 text-on-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-ink-muted">{purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy policy CTA ─────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-outline bg-highlight p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
          <p className="text-xs font-semibold text-ink-muted">
              Full details
            </p>
          <h3 className="font-display mt-1 text-xl font-medium text-ink">
              Read our privacy policy
            </h3>
          <p className="mt-1 max-w-xl text-sm font-medium leading-relaxed text-ink-muted">
              Our privacy policy provides a complete account of all data stored, current safeguards in place,
              and how to request account deletion.
            </p>
          </div>
          <Link
            href="/privacy"
      className="inline-flex shrink-0 items-center gap-2 rounded-[20px] border border-outline bg-forest px-6 py-3 text-sm font-semibold tracking-wide text-on-forest transition-transform duration-75 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Lock size={16} />
            Privacy policy
          </Link>
        </div>

      </div>
    </section>
  )
}
