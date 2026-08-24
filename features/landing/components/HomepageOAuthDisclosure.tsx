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
      className="relative z-10 border-t-4 border-outline bg-canvas px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="transparency-heading"
    >
      <div className="mx-auto max-w-7xl">

        {/* ── Section header ─────────────────────────────────── */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 border-4 border-outline bg-[#4169e1] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-brutal">
            <ShieldCheck size={14} /> App transparency
          </span>
          <h2
            id="transparency-heading"
            className="mt-4 text-3xl font-black uppercase leading-none tracking-tight text-ink sm:text-5xl"
          >
            What SEOlaQuest is,<br />
            {/* Darker than the #ff5a36 brand orange: that shade only reaches 2.73:1
                on the canvas background, below the 3:1 axe requires for large text. */}
            <span className="text-[#D93B0F]">what it does, and why.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-ink/70">
            This section exists so you can make an informed decision before creating an account.
            No inflated claims, no hidden data practices.
          </p>
        </div>

        {/* ── App identity card ──────────────────────────────── */}
        <div className="mb-10 flex flex-col gap-4 border-4 border-outline bg-black p-6 text-white shadow-[8px_8px_0_0_#FFE600] sm:p-8 md:flex-row md:items-start md:gap-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border-4 border-outline bg-accent shadow-brutal">
            <Sword className="h-8 w-8 text-on-accent" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFE600]">Application identity</p>
            <h3 className="mt-1 text-2xl font-black uppercase text-white">SEOlaQuest</h3>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-white/80">
              SEOlaQuest is an AI-powered social listening and lead monitoring platform built for founders and operators.
              It monitors X (Twitter) for your tracked keywords in real time, uses AI agents to classify and score
              matching public posts for buyer intent, and delivers qualified leads directly to your dashboard —
              so you can reach potential customers before your competitors do.
            </p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/50">
              Built by the SEOlaQuest team · Version 1.0
            </p>
          </div>
        </div>

        {/* ── What the app does ──────────────────────────────── */}
        <div className="mb-10">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-ink">
            App functionality
          </h3>
          <div className="grid gap-5 md:grid-cols-3">
            {WHAT_IT_DOES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="flex flex-col gap-4 border-4 border-outline bg-card p-6 shadow-brutal-lg"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-outline bg-accent shadow-brutal-sm">
                  <Icon className="h-6 w-6 text-on-accent" />
                </div>
                <h4 className="text-lg font-black uppercase text-ink">{title}</h4>
                <p className="text-sm font-bold leading-relaxed text-ink/70">{body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* ── Data transparency ──────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-6 flex items-start gap-3">
            <div className="border-2 border-outline bg-highlight p-2 shadow-brutal-sm">
              <Eye className="h-5 w-5 text-on-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-ink">
                Why we request your data
              </h3>
              <p className="mt-1 text-sm font-bold text-ink/60">
                A plain-language breakdown of every data category the app collects and what it is used for.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {DATA_REQUESTED.map(({ icon: Icon, label, purpose }) => (
              <div
                key={label}
                className="flex gap-4 border-4 border-outline bg-card p-6 shadow-brutal"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border-2 border-outline bg-highlight shadow-brutal-sm">
                  <Icon className="h-5 w-5 text-on-accent" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-ink">{label}</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-ink/70">{purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy policy CTA ─────────────────────────────── */}
        <div className="flex flex-col gap-4 border-4 border-outline bg-highlight p-6 shadow-brutal sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/60">
              Full details
            </p>
            <h3 className="mt-1 text-xl font-black uppercase text-ink">
              Read our privacy policy
            </h3>
            <p className="mt-1 max-w-xl text-sm font-bold leading-relaxed text-ink/70">
              Our privacy policy provides a complete account of all data stored, current safeguards in place,
              and how to request account deletion.
            </p>
          </div>
          <Link
            href="/privacy"
            className="inline-flex shrink-0 items-center gap-2 border-4 border-outline bg-black px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-brutal-lg transition-transform duration-75 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[#1a1a1a] hover:shadow-[6px_6px_0_0_#FFE600] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-2"
          >
            <Lock size={16} />
            Privacy policy
          </Link>
        </div>

      </div>
    </section>
  )
}
