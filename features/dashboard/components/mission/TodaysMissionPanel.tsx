'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Crosshair, Radar, ScrollText, Swords, Wallet } from 'lucide-react'
import type { TodaysMission } from '@/features/dashboard/lib/deriveMissionControl'
import { sfx } from '@/lib/sfx'

type TodaysMissionPanelProps = {
  item: Variants
  mission: TodaysMission
  isPending?: boolean
  onScan: () => void
  onReviewLeads: () => void
  onAddKeyword: () => void
  onClaimLead: (leadId: string) => void
  onViewScan: () => void
}

export function TodaysMissionPanel({
  item,
  mission,
  isPending = false,
  onScan,
  onReviewLeads,
  onAddKeyword,
  onClaimLead,
  onViewScan,
}: TodaysMissionPanelProps) {
  const handlePrimary = () => {
    sfx.playCoinDrop()
    switch (mission.action.kind) {
      case 'scan':
        onScan()
        return
      case 'review_leads':
        onReviewLeads()
        return
      case 'add_keyword':
        onAddKeyword()
        return
      case 'claim_lead':
        if (mission.action.leadId) onClaimLead(mission.action.leadId)
        return
      case 'wait_scan':
        onViewScan()
        return
      default:
        return
    }
  }

  const isLinkAction =
    mission.action.kind === 'open_billing' || mission.action.kind === 'open_runs'
  const href =
    mission.action.kind === 'open_billing'
      ? '/app/billing'
      : mission.action.kind === 'open_runs'
        ? '/app/runs'
        : undefined

  const ActionIcon =
    mission.action.kind === 'scan'
      ? Radar
      : mission.action.kind === 'add_keyword'
        ? Crosshair
        : mission.action.kind === 'open_billing'
          ? Wallet
          : mission.action.kind === 'open_runs' || mission.action.kind === 'wait_scan'
            ? ScrollText
            : Swords

  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      aria-labelledby="todays-mission-heading"
      className="relative w-full min-w-0 overflow-hidden rounded-[20px] border border-outline bg-forest text-on-forest shadow-sm"
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6 md:p-8 lg:flex-row lg:items-stretch lg:gap-0">
        <div className="min-w-0 flex-1 lg:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline bg-forest px-2.5 py-1 text-[10px] font-semibold normal-case tracking-wide text-accent shadow-none sm:text-xs">
              <Swords className="size-3.5 shrink-0" aria-hidden />
              {mission.label}
            </span>
            <span className="rounded-lg border border-outline bg-card px-2.5 py-1 text-[10px] font-semibold normal-case tracking-wide text-ink shadow-none sm:text-xs">
              Confidence: {mission.confidence}
            </span>
          </div>

          <p className="mt-4 text-[10px] font-semibold normal-case tracking-[0.2em] text-on-forest/70 sm:text-[11px]">
            Highest-value next step
          </p>

          <h2
            id="todays-mission-heading"
            className="font-display mt-1 text-2xl font-normal leading-tight tracking-tight text-on-forest break-words sm:text-3xl md:text-4xl"
          >
            {mission.title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-on-forest/80 sm:text-base">
            {mission.why}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col justify-end gap-3 border-t border-outline pt-4 lg:w-[280px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {isLinkAction && href ? (
            <Link
              href={href}
              onMouseEnter={() => sfx.playSidebarHover()}
              onClick={() => sfx.playCoinDrop()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent px-4 py-3 text-sm font-semibold normal-case tracking-normal text-on-accent shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm active:translate-x-0 active:translate-y-0"
            >
              <ActionIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{mission.action.ctaLabel}</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePrimary}
              disabled={isPending && mission.action.kind === 'scan'}
              onMouseEnter={() => sfx.playSidebarHover()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[20px] border border-outline bg-accent px-4 py-3 text-sm font-semibold normal-case tracking-normal text-on-accent shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ActionIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{mission.action.ctaLabel}</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  )
}

export default TodaysMissionPanel
