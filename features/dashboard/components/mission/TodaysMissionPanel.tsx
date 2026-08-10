'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Crosshair, Radar, ScrollText, Swords, Wallet } from 'lucide-react'
import type { TodaysMission } from '@/features/dashboard/lib/deriveMissionControl'
import { sfx } from '@/lib/sfx'

const toneClasses: Record<TodaysMission['tone'], string> = {
  action: 'bg-highlight',
  risk: 'bg-[#FFE0C7]',
  opportunity: 'bg-success',
  neutral: 'bg-card',
}

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
      className={`relative w-full min-w-0 overflow-hidden border-4 border-outline shadow-brutal-lg ${toneClasses[mission.tone]}`}
    >
      <div className="flex flex-col gap-5 p-4 sm:p-6 md:p-8 lg:flex-row lg:items-stretch lg:gap-0">
        <div className="min-w-0 flex-1 lg:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border-2 border-outline bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#FFE600] shadow-brutal-sm sm:text-xs">
              <Swords className="size-3.5 shrink-0" aria-hidden />
              {mission.label}
            </span>
            <span className="border-2 border-outline bg-card px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-ink shadow-brutal-sm sm:text-xs">
              Confidence: {mission.confidence}
            </span>
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/60 sm:text-[11px]">
            Highest-value next step
          </p>

          <h2
            id="todays-mission-heading"
            className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-ink break-words sm:text-3xl md:text-4xl"
          >
            {mission.title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed text-ink/80 sm:text-base">
            {mission.why}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col justify-end gap-3 border-t-4 border-outline pt-4 lg:w-[280px] lg:border-l-4 lg:border-t-0 lg:pl-8 lg:pt-0">
          {isLinkAction && href ? (
            <Link
              href={href}
              onMouseEnter={() => sfx.playSidebarHover()}
              onClick={() => sfx.playCoinDrop()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 border-3 border-outline bg-accent px-4 py-3 text-sm font-black uppercase tracking-wider text-on-accent shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0"
            >
              <ActionIcon className="size-4 shrink-0" strokeWidth={3} aria-hidden />
              <span>{mission.action.ctaLabel}</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePrimary}
              disabled={isPending && mission.action.kind === 'scan'}
              onMouseEnter={() => sfx.playSidebarHover()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 border-3 border-outline bg-accent px-4 py-3 text-sm font-black uppercase tracking-wider text-on-accent shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ActionIcon className="size-4 shrink-0" strokeWidth={3} aria-hidden />
              <span>{mission.action.ctaLabel}</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </button>
          )}
          <p className="text-[11px] font-bold uppercase leading-snug text-ink/65">
            One primary action — business facts first, game framing second.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

export default TodaysMissionPanel
