'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Activity, AlertTriangle, CheckCircle2, TimerReset } from 'lucide-react'
import type { CampaignPulse } from '@/features/dashboard/lib/deriveMissionControl'

const trendCopy: Record<
  CampaignPulse['trend'],
  { label: string; tone: string }
> = {
  active: { label: 'Active queue', tone: 'bg-success text-ink' },
  armed: { label: 'Armed', tone: 'bg-highlight-strong text-ink' },
  idle: { label: 'Idle', tone: 'bg-inset text-ink' },
  blocked: { label: 'Blocked', tone: 'bg-highlight text-ink' },
  unknown: { label: 'Unknown', tone: 'bg-card text-ink' },
}

type CampaignPulsePanelProps = {
  item: Variants
  pulse: CampaignPulse
  planLabel?: string
}

export function CampaignPulsePanel({
  item,
  pulse,
  planLabel,
}: CampaignPulsePanelProps) {
  const trend = trendCopy[pulse.trend]
  const creditReading = `${pulse.credits.remaining}/${pulse.credits.max} credits`

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      aria-labelledby="campaign-pulse-heading"
      className="w-full min-w-0 rounded-[20px] border border-outline bg-card shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-outline bg-highlight p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold normal-case tracking-[0.18em] text-ink-muted sm:text-[11px]">
            Campaign pulse
          </p>
          <h2
            id="campaign-pulse-heading"
            className="font-display mt-1 text-xl font-semibold normal-case leading-tight text-ink sm:text-2xl"
          >
            Current campaign state
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-ink/75">
            {pulse.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-h-11 items-center rounded-lg border border-outline px-3 py-2 text-xs font-semibold normal-case shadow-none ${trend.tone}`}
          >
            <Activity className="mr-2 size-4 shrink-0" aria-hidden />
            {trend.label}
          </span>
          <span className="inline-flex min-h-11 items-center rounded-lg border border-outline bg-black px-3 py-2 text-xs font-semibold normal-case text-accent shadow-none">
            {creditReading}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
        <div className="border-b border-outline p-4 md:border-b-0 md:border-r md:p-5">
          <p className="text-[10px] font-semibold normal-case tracking-wide text-ink/55">Measured counts</p>
          <ul className="mt-3 space-y-2 text-sm font-medium text-ink">
            <li>{pulse.counts.keywords} tracked keywords ({pulse.counts.activeKeywords} active)</li>
            <li>{pulse.counts.openLeads} open leads</li>
            <li>{pulse.counts.liveScoredLeads} LIVE-scored</li>
            {planLabel ? <li className="text-ink-muted">{planLabel}</li> : null}
          </ul>
        </div>

        <div className="border-b border-outline p-4 md:border-b-0 md:border-r md:p-5">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold normal-case tracking-wide text-ink/55">
            <CheckCircle2 className="size-3.5 shrink-0 text-[#16A34A]" aria-hidden />
            Wins
          </p>
          <ul className="space-y-2 text-sm font-medium text-ink">
            {pulse.wins.map((win) => (
              <li key={win}>{win}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 md:p-5">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold normal-case tracking-wide text-ink/55">
            <AlertTriangle className="size-3.5 shrink-0 text-[#D97706]" aria-hidden />
            Risks
          </p>
          <ul className="space-y-2 text-sm font-medium text-ink">
            {pulse.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline bg-inset p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="inline-flex items-start gap-2 text-xs font-medium normal-case leading-snug text-ink-muted">
          <TimerReset className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Freshness: {pulse.freshness.state}. {pulse.freshness.detail} Do not treat this panel as
            live-synced until a measured last-scan timestamp exists on the payload.
          </span>
        </p>
        <Link
          href="/app/runs"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline bg-card px-4 py-2 text-xs font-semibold normal-case shadow-none hover:bg-highlight"
        >
          Open run history
        </Link>
      </div>
    </motion.section>
  )
}

export default CampaignPulsePanel
