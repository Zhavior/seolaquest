'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  Crown,
  Crosshair,
  Radar,
  ScrollText,
  Shield,
  Swords,
} from 'lucide-react'
import HeroCrest from '@/components/HeroCrest'
import type { DashboardLead, DashboardUser } from '@/features/dashboard/types'
import type { DashboardSliceStatus } from '@/features/dashboard/hooks/useDashboardState'

type DashboardStatsProps = {
  item: Variants
  user: DashboardUser
  characterTitle: string
  isScanning: boolean
  recentLevelUp: boolean
  xpPercent: number
  leads: DashboardLead[]
  remainingQuests: number
  maxCredits: number
  leadsSliceStatus?: DashboardSliceStatus
  shareStats?: () => void
}

function countLiveScored(leads: DashboardLead[]) {
  return leads.filter((lead) => lead.aurora?.evaluationStatus === 'LIVE').length
}

function ProviderStatusStrip() {
  const providers = [
    {
      label: 'X',
      state: 'LIVE',
      detail: 'Only live public source today',
      tone: 'bg-success',
      text: 'text-ink',
    },
    {
      label: 'Reddit',
      state: 'IN BUILD',
      detail: 'Not available yet',
      tone: 'bg-highlight-strong',
      text: 'text-ink',
    },
    {
      label: 'LinkedIn',
      state: 'IN BUILD',
      detail: 'Not available yet',
      tone: 'bg-card',
      text: 'text-ink',
    },
  ] as const

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {providers.map((provider) => (
        <li key={provider.label}>
          <span
            title={`${provider.label}: ${provider.state} — ${provider.detail}`}
            className={`inline-flex min-h-11 min-w-0 items-center gap-2 border-2 border-outline px-3 py-2 text-xs font-black uppercase tracking-wider shadow-brutal-sm ${provider.tone} ${provider.text}`}
          >
            <span className="sr-only">
              {provider.label}: {provider.state}. {provider.detail}.
            </span>
            <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span aria-hidden className="truncate">
              {provider.label} · {provider.state}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function TelemetryCard({
  icon,
  label,
  value,
  detail,
  tone = 'bg-card',
  testId,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone?: string
  testId: string
}) {
  return (
    <div
      data-testid={testId}
      className={`flex h-full flex-col border-4 border-outline p-5 shadow-brutal-lg sm:p-6 ${tone}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-ink/70">{label}</p>
        <div className="border-2 border-outline bg-[#FFF4BF] p-2 shadow-brutal-sm">{icon}</div>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-black uppercase leading-none text-ink md:text-4xl">{value}</p>
        <p className="mt-3 text-xs font-bold uppercase leading-relaxed text-ink/80">{detail}</p>
      </div>
    </div>
  )
}

/**
 * Progress + system health from measured account facts only.
 * No regex intent scores, ARR projections, sync clocks, or invented daily XP bonuses.
 */
export function DashboardStats({
  item,
  user,
  characterTitle,
  isScanning,
  recentLevelUp,
  xpPercent,
  leads,
  remainingQuests,
  maxCredits,
  leadsSliceStatus = 'ok',
}: DashboardStatsProps) {
  const entitlements = user.entitlements ?? {
    canUsePaidScans: false,
    canGenerateAIReplies: false,
    canExportToCRM: false,
  }
  const liveScored = countLiveScored(leads)
  const creditReading = `${remainingQuests}/${maxCredits}`
  const xpReading = `${user.xp}/${user.xpRequired} XP · ${xpPercent}%`

  const measuredChecklist = [
    {
      label: 'Open leads in queue',
      progressLabel: `${leads.length}`,
      done: leads.length > 0,
      tone: 'bg-[#C7FFF3]',
    },
    {
      label: 'LIVE Aurora scores present',
      progressLabel: `${liveScored}`,
      done: liveScored > 0,
      tone: 'bg-highlight-strong',
    },
    {
      label: 'Scan credits available',
      progressLabel: creditReading,
      done: remainingQuests > 0,
      tone: 'bg-success',
    },
  ]

  return (
    <motion.div variants={item} className="flex w-full min-w-0 max-w-full flex-col gap-6">
      <section
        aria-labelledby="system-health-heading"
        className="border-4 border-outline bg-highlight p-5 shadow-brutal-lg sm:p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/60">System health</p>
              <h2 id="system-health-heading" className="mt-1 text-xl font-black uppercase text-ink sm:text-2xl">
                Providers & entitlements
              </h2>
            </div>
            <span
              className={`inline-flex min-h-11 items-center border-2 border-outline px-3 py-2 text-xs font-black uppercase shadow-brutal-sm ${
                leadsSliceStatus === 'degraded' ? 'bg-[#FFE0C7] text-ink' : 'bg-card text-ink'
              }`}
            >
              Queue: {leadsSliceStatus === 'degraded' ? 'degraded' : 'ok'}
            </span>
          </div>

          <ProviderStatusStrip />

          <p className="inline-flex items-start gap-2 text-xs font-bold uppercase leading-snug text-ink/70">
            <Radar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {isScanning
                ? 'A scan is running or the scanner modal is open.'
                : 'No scan freshness timestamp is available on this payload — status is not claimed as live-synced.'}
            </span>
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/runs"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-outline bg-card px-3 py-2 text-xs font-black uppercase shadow-brutal-sm hover:bg-highlight"
            >
              <ScrollText className="h-4 w-4" aria-hidden />
              Open run history
            </Link>
            <Link
              href="/app/billing"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-outline bg-card px-3 py-2 text-xs font-black uppercase shadow-brutal-sm hover:bg-highlight"
            >
              Open billing
            </Link>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="progress-path-heading"
            className="border-4 border-outline bg-highlight p-5 shadow-brutal-lg sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-[#FF5722]" aria-hidden />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/60">Progress path</p>
                  <h2 id="progress-path-heading" className="text-xl font-black uppercase text-ink sm:text-2xl">
                    Hunter progression
                  </h2>
                </div>
              </div>
              <span className="border-2 border-outline bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600]">
                Level {user.level}
              </span>
            </div>

            <HeroCrest
              heroName={user.name}
              heroTitle={characterTitle}
              level={user.level}
              isScanning={isScanning}
              recentLevelUp={recentLevelUp}
            />

            <div className="mt-5 border-3 border-outline bg-black p-3 shadow-brutal-sm">
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black uppercase text-[#FFE600]">
                <span>XP toward next level</span>
                <span>{xpReading}</span>
              </div>
              <div
                className="h-3 w-full overflow-hidden border-2 border-white bg-slate-900"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={xpPercent}
                aria-label={`Experience progress ${xpPercent} percent`}
              >
                <div className="h-full bg-[#FFE600]" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </section>

          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <TelemetryCard
              testId="telemetry-open-leads"
              icon={<Swords className="h-6 w-6 text-ink" />}
              label="Open lead queue"
              value={`${leads.length}`}
              detail="Measured count of NEW/VIEWED leads currently in the dashboard feed."
              tone="bg-card"
            />
            <TelemetryCard
              testId="telemetry-live-aurora"
              icon={<Crosshair className="h-6 w-6 text-ink" />}
              label="LIVE Aurora scores"
              value={`${liveScored}`}
              detail={
                liveScored > 0
                  ? 'Leads with evaluationStatus LIVE only — FALLBACK scores are not counted as intent.'
                  : 'No LIVE Aurora verdicts in the current queue.'
              }
              tone="bg-highlight-strong"
            />
            <TelemetryCard
              testId="telemetry-scan-credits"
              icon={<Radar className="h-6 w-6 text-ink" />}
              label="Scan credits"
              value={creditReading}
              detail="Remaining scan credits versus this account's measured high-water mark."
              tone="bg-info"
            />
            <TelemetryCard
              testId="telemetry-plan"
              icon={<Shield className="h-6 w-6 text-ink" />}
              label="Plan"
              value={user.planLabel ?? 'NO ACTIVE PLAN'}
              detail={
                entitlements.canUsePaidScans
                  ? 'Paid scans entitled on this account.'
                  : 'Paid scans are locked by current entitlements.'
              }
              tone="bg-[#FFE3C7]"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="ops-checklist-heading"
            className="flex flex-col border-4 border-outline bg-[#FFF9EC] p-5 shadow-brutal-lg sm:p-6"
          >
            <p className="text-xs font-black uppercase tracking-widest text-ink/60">Operations checklist</p>
            <h3 id="ops-checklist-heading" className="mt-1 text-2xl font-black uppercase text-on-accent">
              Measured readiness
            </h3>
            <p className="mt-2 text-xs font-bold text-ink/70">
              No bonus XP is promised here — progression is decided by the Gamify ledger after real events.
            </p>

            <div className="mt-4 flex flex-1 flex-col gap-2">
              {measuredChecklist.map((row) => (
                <div
                  key={row.label}
                  className={`flex min-w-0 flex-wrap items-center justify-between gap-2 border-3 border-outline px-4 py-3 text-xs font-black uppercase tracking-wider shadow-brutal-sm ${
                    row.done ? row.tone : 'bg-card'
                  }`}
                >
                  <span className="min-w-0 flex-1 break-words">
                    {row.done ? '[x]' : '[ ]'} {row.label}
                  </span>
                  <span className="shrink-0 whitespace-nowrap">{row.progressLabel}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="unlock-track-heading"
            className="border-4 border-outline bg-card p-5 shadow-brutal-lg sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-ink/60">Entitlements</p>
                <h3 id="unlock-track-heading" className="mt-1 text-2xl font-black uppercase text-on-accent">
                  Unlock track
                </h3>
              </div>
              <div className="border-2 border-outline bg-[#FFF4BF] p-2 shadow-brutal-sm">
                <Shield className="h-6 w-6 text-on-accent" aria-hidden />
              </div>
            </div>

            <ul className="mt-2 flex flex-col gap-3">
              {[
                {
                  title: 'AI reply drafts',
                  detail: entitlements.canGenerateAIReplies
                    ? 'Entitled — draft replies from signal cards.'
                    : 'Locked — included with a paid plan.',
                  state: entitlements.canGenerateAIReplies ? 'UNLOCKED' : 'LOCKED',
                },
                {
                  title: 'CRM export',
                  detail: entitlements.canExportToCRM
                    ? 'Entitled — queue CRM webhook deliveries from signal cards.'
                    : 'Locked — included with a paid plan.',
                  state: entitlements.canExportToCRM ? 'UNLOCKED' : 'LOCKED',
                },
                {
                  title: 'Paid scans',
                  detail: entitlements.canUsePaidScans
                    ? 'Entitled — manual scans spend scan credits.'
                    : 'Locked — upgrade required for paid scans.',
                  state: entitlements.canUsePaidScans ? 'UNLOCKED' : 'LOCKED',
                },
                {
                  title: 'Multi-feed scanner',
                  detail: 'X is the only live source. Reddit and LinkedIn are still in build.',
                  state: 'IN BUILD',
                },
              ].map((perk) => (
                <li
                  key={perk.title}
                  className={`border-3 border-outline p-4 shadow-brutal-sm ${
                    perk.state === 'UNLOCKED' ? 'bg-success' : 'bg-highlight'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase text-ink">{perk.title}</p>
                      <p className="mt-1 text-xs font-bold text-ink/75">{perk.detail}</p>
                    </div>
                    <span className="shrink-0 border-2 border-outline bg-black px-2 py-0.5 text-xs font-black uppercase text-[#FFE600]">
                      {perk.state}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-ink/65">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Entitlements come from EntitlementService — not from hunter level.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
