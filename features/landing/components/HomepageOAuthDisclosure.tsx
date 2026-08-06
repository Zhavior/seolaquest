import Link from 'next/link'
import {
  CheckCircle2,
  Coins,
  Database,
  FileText,
  KeyRound,
  Lock,
  Monitor,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sword,
  Trash2,
  UserCheck,
  Zap,
} from 'lucide-react'
import { questBadge, questSurface } from '@/components/quest'

const FUNCTIONALITY_STEPS = [
  {
    icon: Radar,
    step: 'STEP 01',
    title: 'Monitors public conversations',
    body: 'SEOlaQuest scans publicly visible posts on X (Twitter) and Reddit for configured keywords. Only public content is read — zero DMs or restricted posts.',
    badge: 'PUBLIC ONLY',
  },
  {
    icon: Zap,
    step: 'STEP 02',
    title: 'Scores intent & buyer pain',
    body: 'AI agents classify matching posts for intent, pain relevance, and urgency score. Qualified matches populate your inbox immediately.',
    badge: 'AIIntent ENGINE',
  },
  {
    icon: Monitor,
    step: 'STEP 03',
    title: 'Delivers leads with evidence',
    body: 'Scored matches land in your Command Center with source link, timestamp, and confidence notes — review evidence before acting.',
    badge: 'REALM DASHBOARD',
  },
]

const VAULT_ITEMS = [
  {
    icon: UserCheck,
    label: 'Account Identity',
    tag: 'CLERK OAUTH 2.0',
    tagTone: 'gold' as const,
    purpose:
      'Email address and display name used to create and identify your account. Stored securely to associate keyword quests, scan history, and mana balance.',
  },
  {
    icon: KeyRound,
    label: 'Authentication Tokens',
    tag: 'AES-256 ENCRYPTED',
    tagTone: 'ember' as const,
    purpose:
      'OAuth tokens for X (Twitter) allow you to reply directly from SEOlaQuest. Stored encrypted and used solely for authorized user actions — never auto-posted.',
  },
  {
    icon: Coins,
    label: 'Billing & Mana State',
    tag: 'STRIPE SECURE',
    tagTone: 'gold' as const,
    purpose:
      'Stripe manages payments. We store only customer IDs and subscription status — never credit cards. Mana balances are tracked for accurate scan quotas.',
  },
  {
    icon: Database,
    label: 'Product Activity',
    tag: 'TENANT-ISOLATED',
    tagTone: 'ink' as const,
    purpose:
      'Tracked keywords, intent signals, scan results, and saved leads are scoped strictly to your account vault and never shared across tenants.',
  },
]

const PRIVACY_GUARANTEES = [
  {
    icon: ShieldAlert,
    title: 'Zero Data Selling',
    description: 'Your search keywords, signals, and contact lists are never sold, rented, or monetized.',
  },
  {
    icon: Trash2,
    title: '1-Click Data Wipe',
    description: 'Delete your account anytime from settings to permanently purge all tokens and quest history.',
  },
  {
    icon: CheckCircle2,
    title: 'GDPR & CCPA Ready',
    description: 'Minimal data retention scoped strictly to core app functionality and your active session.',
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
        {/* ── Section Header ─────────────────────────────────── */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className={questBadge({ tone: 'gold', shadow: 'xs', border: 3 })}>
              <ShieldCheck className="mr-1.5 inline-block h-3.5 w-3.5" />
              Security Seals & Vault Protocol
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-ink-muted">
              SYSTEM: ENCRYPTED & PRIVACY SCOPED
            </span>
          </div>

          <h2
            id="transparency-heading"
            className="mt-4 text-3xl font-black uppercase leading-none tracking-tight text-ink sm:text-5xl"
          >
            Grounded in trust &<br />
            <span className="text-accent-2">full transparency.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed text-ink/70">
            Know exactly what data SEOlaQuest requests, how AI agents process public signals, and how your tokens stay safe in the Vault before creating an account.
          </p>
        </div>

        {/* ── App Identity Banner (Vault Identity) ────────────── */}
        <div
          className={questSurface({
            tone: 'ink',
            shadow: 'lg',
            border: 4,
            className: 'mb-12 flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-start md:gap-8',
          })}
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border-4 border-outline bg-accent shadow-brutal">
            <Sword className="h-8 w-8 text-on-accent" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                Vault Identity // App Metadata
              </p>
              <span className="border-2 border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/80">
                REALM v1.0 CERTIFIED
              </span>
            </div>

            <h3 className="mt-1 text-2xl font-black uppercase text-white">SEOlaQuest</h3>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-white/80">
              SEOlaQuest is an AI-powered social listening and lead monitoring SaaS built for founders and operators.
              It scans X (Twitter) and Reddit for tracked keywords in real time, uses AI agents to classify buyer intent,
              and delivers qualified leads directly to your Command Center dashboard.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-[0.14em] text-white/60">
              <span>Verified App Scope</span>
              <span>·</span>
              <span>No Automated Spam</span>
              <span>·</span>
              <span>OAuth 2.0 Auth</span>
            </div>
          </div>
        </div>

        {/* ── App Functionality Workflow ─────────────────────── */}
        <div className="mb-14">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight text-ink">
              System Pipeline Architecture
            </h3>
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink-muted">
              3-STAGE PROCESS
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FUNCTIONALITY_STEPS.map(({ icon: Icon, step, title, body, badge }) => (
              <article
                key={title}
                className={questSurface({
                  tone: 'white',
                  shadow: 'md',
                  border: 4,
                  className: 'flex flex-col gap-4 p-6 transition-transform duration-75 hover:-translate-y-1 hover:shadow-brutal-lg',
                })}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center border-3 border-outline bg-accent shadow-brutal-sm">
                    <Icon className="h-6 w-6 text-on-accent" />
                  </div>
                  <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-ink-muted">
                    {step}
                  </span>
                </div>

                <div>
                  <span className={questBadge({ tone: 'sand', shadow: 'xs', border: 2, className: 'mb-2 text-[9px]' })}>
                    {badge}
                  </span>
                  <h4 className="mt-1 text-lg font-black uppercase text-ink">{title}</h4>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-ink/70">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── Data Vault Inventory ────────────────────────────── */}
        <div className="mb-14">
          <div className="mb-6 flex items-start gap-3">
            <div className="border-3 border-outline bg-highlight p-2 shadow-brutal-sm">
              <Lock className="h-5 w-5 text-on-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-ink">
                Vault Data Inventory
              </h3>
              <p className="mt-1 text-sm font-bold text-ink-muted">
                Every data asset stored in the Vault and why it is requested.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {VAULT_ITEMS.map(({ icon: Icon, label, tag, tagTone, purpose }) => (
              <div
                key={label}
                className={questSurface({
                  tone: 'white',
                  shadow: 'md',
                  border: 4,
                  className: 'flex flex-col gap-4 p-6 transition-all duration-75 hover:-translate-y-1 hover:shadow-brutal-lg',
                })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-outline bg-highlight shadow-brutal-sm">
                      <Icon className="h-5 w-5 text-on-accent" />
                    </div>
                    <p className="text-base font-black uppercase tracking-[0.08em] text-ink">
                      {label}
                    </p>
                  </div>

                  <span className={questBadge({ tone: tagTone, shadow: 'xs', border: 2, className: 'text-[9px]' })}>
                    {tag}
                  </span>
                </div>

                <p className="text-sm font-bold leading-relaxed text-ink/75">{purpose}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2-Column Privacy & Trust Footer ───────────────── */}
        <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
          {/* Left CTA Box */}
          <div
            className={questSurface({
              tone: 'gold',
              shadow: 'lg',
              border: 4,
              className: 'flex flex-col justify-between p-6 sm:p-8',
            })}
          >
            <div>
              <span className={questBadge({ tone: 'ember', shadow: 'xs', border: 2, className: 'mb-3 text-[9px]' })}>
                VAULT CONTRACT v1.0
              </span>
              <h3 className="text-2xl font-black uppercase leading-tight text-on-accent">
                Read our complete privacy policy
              </h3>
              <p className="mt-3 text-sm font-bold leading-relaxed text-on-accent/80">
                Our formal privacy contract provides a complete breakdown of data retention windows, third-party API isolation, and instructions for full account deletion.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/privacy"
                className="inline-flex w-full items-center justify-center gap-2 border-4 border-outline bg-black px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-brutal-lg transition-all duration-75 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none"
              >
                <FileText className="h-4 w-4" />
                Read Privacy Policy
              </Link>
            </div>
          </div>

          {/* Right Trust Guarantees Grid */}
          <div
            className={questSurface({
              tone: 'sand',
              shadow: 'lg',
              border: 4,
              className: 'flex flex-col justify-between p-6 sm:p-8',
            })}
          >
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">
                Trust & Compliance Standards
              </p>
              <h4 className="mt-1 text-xl font-black uppercase text-ink">
                Our Guarantee to Operators
              </h4>
            </div>

            <div className="mt-6 grid gap-4">
              {PRIVACY_GUARANTEES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 border-2 border-outline bg-card p-3.5 shadow-brutal-sm"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border-2 border-outline bg-accent text-on-accent shadow-brutal-xs">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-ink">
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs font-bold leading-normal text-ink/70">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
