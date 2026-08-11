'use client'

import { memo, useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import {
  Flame,
  Crosshair,
  Sparkles,
  Coins,
  Sword,
  ShieldAlert,
  ChevronRight,
  Crown,
  Radar,
  Search,
  X,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react'
import { isSampleQuest, SAMPLE_QUEST_PLATFORM } from '@/src/modules/onboarding/domain/sampleQuests'
import type { DashboardLead } from '@/features/dashboard/types'
import { XTwitterIcon, RedditIcon } from '@/components/PlatformIcons'

type DashboardFeedProps = {
  item: Variants
  filteredLeads: DashboardLead[]
  platforms: string[]
  filter: string
  setFilter: (f: string) => void
  isPending: boolean
  handleClaimBounty: (lead: DashboardLead) => void
  generateAIReply: (lead: DashboardLead) => void
  exportToCRM: (lead: DashboardLead) => void
  dismissLead: (id: string) => void
  handlePresetClick: (phrase: string) => void
}

type SignalBadge = 'LIVE_SCORED' | 'UNSCORED' | 'SCORING_UNAVAILABLE'

const signalBadgeStyles: Record<
  SignalBadge,
  { label: string; wrap: string; badge: string; border: string; accent: string }
> = {
  LIVE_SCORED: {
    label: 'LIVE SCORED',
    wrap: 'bg-[#FFFBEB]',
    badge: 'bg-highlight-strong text-amber-950 border-amber-500',
    border: 'border-l-8 border-l-amber-500',
    accent: 'bg-amber-500 hover:bg-amber-600 text-on-accent font-black',
  },
  UNSCORED: {
    label: 'NOT SCORED',
    wrap: 'bg-[#F8FAFC]',
    badge: 'bg-[#E2E8F0] text-ink border-hairline',
    border: 'border-l-8 border-l-slate-400',
    accent: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  SCORING_UNAVAILABLE: {
    label: 'SCORING UNAVAILABLE',
    wrap: 'bg-[#F0F9FF]',
    badge: 'bg-[#BAE6FD] text-blue-900 border-blue-400',
    border: 'border-l-8 border-l-blue-500',
    accent: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

function getPlatformTone(platform: string) {
  const normalized = platform.toUpperCase()

  // Seeded tutorial rows get their own chip. They must never be mistaken for a
  // real source, so this is checked before the platform matchers below.
  if (normalized === SAMPLE_QUEST_PLATFORM) {
    return {
      label: 'TUTORIAL SAMPLE',
      icon: <GraduationCap className="h-4 w-4 text-on-accent" />,
      chip: 'bg-highlight-strong text-on-accent',
    }
  }

  if (normalized.includes('REDDIT')) {
    return {
      label: 'REDDIT',
      icon: <RedditIcon className="h-4 w-4 text-[#FF5722]" />,
      chip: 'bg-card text-ink',
    }
  }

  if (normalized.includes('TWITTER') || normalized.includes('X')) {
    return {
      label: 'TWITTER / X',
      icon: <XTwitterIcon className="h-4 w-4 text-ink" />,
      chip: 'bg-black text-white',
    }
  }

  return {
    label: normalized,
    icon: <Crosshair className="h-4 w-4 text-on-accent" />,
    chip: 'bg-highlight text-on-accent',
  }
}

/**
 * Presentation badge from Aurora truth only — never regex "loot rarity".
 */
function getSignalBadge(lead: DashboardLead): SignalBadge {
  const aurora = lead.aurora
  if (!aurora) return 'UNSCORED'
  if (aurora.evaluationStatus === 'LIVE') return 'LIVE_SCORED'
  return 'SCORING_UNAVAILABLE'
}

/**
 * What Aurora actually concluded, or an explicit "not scored" — never a guess.
 *
 * This replaced a regex that started every lead at 58 and added points for words
 * like "budget", then rendered the total as "N% intent match" beside a dollar
 * ARR figure derived from the same number. Both were presented as measurements.
 * In production every real Aurora decision is a FALLBACK 50 (the classifier is
 * unreachable), so those percentages described nothing but the regex itself —
 * one of them labelled a tweet about the $CRM stock ticker a 70% match.
 *
 * A lead with no verdict is worth showing: the customer can still read it and
 * judge. What is not acceptable is implying a machine judged it when none did.
 */
type IntentDisplay =
  | { kind: 'scored'; score: number; action: string }
  | { kind: 'unscored'; label: string }

function getIntentDisplay(lead: DashboardLead): IntentDisplay {
  const aurora = lead.aurora

  if (!aurora) return { kind: 'unscored', label: 'Not scored yet' }

  // Only LIVE means the semantic classifier ran. DETERMINISTIC_ONLY, FALLBACK,
  // and UNAVAILABLE all still carry a finalScore, and showing it would restate
  // the same false precision this function exists to remove.
  if (aurora.evaluationStatus !== 'LIVE') {
    return { kind: 'unscored', label: 'Scoring unavailable' }
  }

  return { kind: 'scored', score: aurora.score, action: aurora.recommendedAction }
}

/**
 * The prose form of the same claim, so it degrades with it. Saying "urgent buyer
 * language detected" about a post nothing has read is the same fabrication as
 * printing a percentage for it.
 *
 * Unscored leads do not use this block in the card list — they render a compact
 * pending badge instead. Detail modal still calls this for scored reads only.
 */
function getTacticalRead(intent: IntentDisplay): string {
  if (intent.kind !== 'scored') {
    return 'Pending Aurora evaluation.'
  }
  if (intent.score >= 90) {
    return 'Urgent buyer language detected. Active switch decision with strong commercial intent.'
  }
  if (intent.score >= 80) {
    return 'Comparison or replacement intent present. Good candidate for a fast reply.'
  }
  if (intent.score >= 70) {
    return 'Problem-aware prospect with relevant keywords. Worth drafting early.'
  }
  return 'Early-stage market pain mention. Lower urgency, but useful for visibility.'
}

/**
 * A post that is only a shortened URL (and maybe @mentions) has nothing for an
 * operator to triage. Mirror the ingest substantiveText bar for already-stored rows.
 */
function isBareLinkLead(content: string): boolean {
  const text = content
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^(?:\s*@\w+)+/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 8) return true
  return text.split(' ').filter(Boolean).length < 2
}

function getKeywords(lead: DashboardLead) {
  return lead.matched
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function formatTimestamp(sourceCreatedAt: string | null) {
  if (!sourceCreatedAt) return 'Source time unknown'

  const created = new Date(sourceCreatedAt).getTime()
  if (Number.isNaN(created)) return 'Source time unknown'

  const diffMs = Date.now() - created
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function EmptyRadarState({ handlePresetClick }: { handlePresetClick: (phrase: string) => void }) {
  return (
    <div className="relative mt-6 overflow-hidden border-4 border-outline bg-card p-6 shadow-brutal-lg md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,#00000014_1px,transparent_1px),linear-gradient(to_bottom,#00000014_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-outline bg-accent shadow-brutal-lg">
          <div className="absolute inset-3 rounded-full border-2 border-outline/20" />
          <div className="absolute inset-6 rounded-full border-2 border-outline/15" />
          <div className="absolute h-[2px] w-12 origin-left -rotate-12 bg-black animate-pulse" />
          <Radar className="relative z-10 h-12 w-12 text-ink" />
        </div>

        <div className="inline-flex items-center gap-2 border-2 border-outline bg-black px-3 py-1.5 text-xs font-mono font-black uppercase tracking-widest text-[#FFE600] shadow-brutal-sm">
          <ShieldAlert className="h-4 w-4" />
          [ RADAR CLEAR // NO ACTIVE SIGNALS IN SECTOR ]
        </div>

        <h3 className="mt-6 text-3xl md:text-4xl font-black uppercase tracking-tight text-ink leading-none">
          Arm a keyword and cast your first scan
        </h3>

        <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-ink/75">
          Your loot board wakes up when the hunt begins. Target buyer pain, comparison intent, and replacement language to reveal high-value leads.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['hubspot alternative', 'looking for crm', 'pipeline analytics'].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handlePresetClick(phrase)}
              className="border-3 border-outline bg-card px-4 py-2 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent min-h-[44px]"
            >
              {phrase}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handlePresetClick('looking for crm')}
          className="mt-6 inline-flex min-h-[44px] items-center gap-3 border-4 border-outline bg-accent-2 px-6 py-3 text-sm font-black uppercase text-white shadow-brutal-lg transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-sm"
        >
          <Sword className="h-5 w-5" />
          Arm keyword & cast scan
        </button>
      </div>
    </div>
  )
}

function DashboardFeedComponent({
  item,
  filteredLeads,
  platforms,
  filter,
  setFilter,
  isPending,
  handleClaimBounty,
  generateAIReply,
  exportToCRM,
  dismissLead,
  handlePresetClick,
}: DashboardFeedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDetailLead, setActiveDetailLead] = useState<DashboardLead | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid')
  const shouldReduceMotion = useReducedMotion()
  const detailCloseRef = useRef<HTMLButtonElement>(null)
  const detailDialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!activeDetailLead) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    detailCloseRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setActiveDetailLead(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [activeDetailLead])

  const displayedLeads = useMemo(() => {
    const actionable = filteredLeads.filter((lead) => !isBareLinkLead(lead.content))
    if (!searchQuery.trim()) return actionable
    const q = searchQuery.toLowerCase()
    return actionable.filter(
      (lead) =>
        lead.content.toLowerCase().includes(q) ||
        (lead.author && lead.author.toLowerCase().includes(q)) ||
        lead.matched.toLowerCase().includes(q) ||
        lead.platform.toLowerCase().includes(q)
    )
  }, [filteredLeads, searchQuery])

  return (
    <motion.section
      id="battle-ready-signals"
      variants={item}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden border-4 border-outline bg-highlight p-4 sm:p-6 md:p-8 shadow-brutal-lg"
    >
      {/* Resilient Warming / Stale Data Indicator */}
      {isPending && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center justify-between border-3 border-outline bg-accent px-3.5 py-2 text-xs font-black uppercase shadow-brutal-sm"
        >
          <span className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 text-on-accent ${shouldReduceMotion ? '' : 'animate-spin'}`}
              aria-hidden
            />
            Updating queue — keeping current leads visible
          </span>
          <span className="hidden sm:inline-block border border-outline bg-card text-ink px-2 py-0.5 text-[10px] font-black uppercase">
            Measured queue
          </span>
        </div>
      )}

      {/* Compact Header & Controls */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="mt-1 border-4 border-outline bg-accent-2 p-2.5 shadow-brutal-sm sm:p-4 sm:shadow-brutal">
            <Flame className="h-6 w-6 text-white sm:h-10 sm:w-10" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-black text-[#FFE600] uppercase text-[10px] sm:text-xs font-black tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 border-2 border-outline -rotate-1">
                Opportunity Queue
              </span>
            </div>

            <h2
              className="text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white drop-shadow-brutal mt-0.5"
              style={{ WebkitTextStroke: '1.5px black' }}
            >
              Open leads to triage
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 border-2 sm:border-3 border-outline bg-accent px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase shadow-brutal-sm sm:shadow-brutal-sm">
                <Crosshair className="h-3.5 w-3.5" />
                {displayedLeads.length} {displayedLeads.length === 1 ? 'signal' : 'signals'}
              </div>

              <div className="inline-flex items-center gap-1.5 border-2 sm:border-3 border-outline bg-info px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase shadow-brutal-sm sm:shadow-brutal-sm text-on-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Fresh intent
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1 border-3 border-outline bg-card p-1 shadow-brutal-sm shrink-0 self-start xl:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition ${
              viewMode === 'grid'
                ? 'bg-accent text-on-accent border-2 border-outline shadow-brutal-sm'
                : 'text-ink-muted hover:text-on-accent'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('compact')}
            aria-label="Compact list view"
            aria-pressed={viewMode === 'compact'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition ${
              viewMode === 'compact'
                ? 'bg-accent text-on-accent border-2 border-outline shadow-brutal-sm'
                : 'text-ink-muted hover:text-on-accent'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compact List</span>
          </button>
        </div>
      </div>

      {/* Primary Search Row & Horizontally Scrollable Tactical Filters */}
      <div className="mb-6 space-y-3">
        {/* Full-width Search Bar */}
        <div className="relative flex items-center border-4 border-outline bg-card shadow-brutal">
          <Search className="absolute left-3.5 h-4 w-4 text-ink/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH SIGNALS, PLAYERS, KEYWORDS..."
            className="w-full bg-transparent py-2.5 pl-10 pr-10 text-xs sm:text-sm font-black uppercase text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-[#FFE600]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-ink/60 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Horizontally Scrollable Tactical Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar -mx-1 px-1">
          {platforms.map((platform) => {
            const normalized = platform.toUpperCase()
            const isTw = normalized.includes('TWITTER') || normalized.includes('X')
            const isRd = normalized.includes('REDDIT')

            return (
              <button
                key={platform}
                type="button"
                onClick={() => setFilter(platform)}
                className={`flex shrink-0 min-h-[40px] items-center gap-2 border-3 border-outline px-3.5 py-1.5 text-xs font-black uppercase shadow-brutal-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  filter === platform ? 'bg-accent text-ink' : 'bg-card text-ink hover:bg-accent'
                }`}
              >
                {isTw ? <XTwitterIcon className="h-3.5 w-3.5 text-ink" /> : null}
                {isRd ? <RedditIcon className="h-3.5 w-3.5 text-[#FF5722]" /> : null}
                {platform === 'TWITTER' ? 'TWITTER / X' : platform}
              </button>
            )
          })}
        </div>
      </div>

      {displayedLeads.length ? (
        <>
          {/* COMPACT LIST VIEW MODE (High-efficiency triage for 50+ leads) */}
          {viewMode === 'compact' ? (
            <div className="space-y-2.5">
              {displayedLeads.map((lead) => {
                const badge = getSignalBadge(lead)
                const badgeStyle = signalBadgeStyles[badge]
                const platformTone = getPlatformTone(lead.platform)
                const intentDisplay = getIntentDisplay(lead)
                const freshness = formatTimestamp(lead.sourceCreatedAt)

                return (
                  <article
                    key={`compact-${lead.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveDetailLead(lead)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setActiveDetailLead(lead)
                      }
                    }}
                    aria-label={`Open lead from ${lead.author} on ${lead.platform}`}
                    className={`cursor-pointer border-3 border-outline bg-card p-3 ${badgeStyle.border} shadow-brutal-sm hover:-translate-y-0.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 focus-visible:outline-none`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1 border-2 border-outline px-2 py-0.5 text-[10px] font-black uppercase shrink-0 ${badgeStyle.badge} shadow-brutal-sm`}>
                        {intentDisplay.kind === 'scored' ? `${intentDisplay.score}% MATCH` : 'UNSCORED'}
                      </span>

                      <span className={`inline-flex items-center gap-1 border border-outline px-2 py-0.5 text-[10px] font-black uppercase shrink-0 ${platformTone.chip}`}>
                        {platformTone.icon}
                        {platformTone.label}
                      </span>

                      <p className="text-xs sm:text-sm font-bold text-ink truncate flex-1">
                        “{lead.content}”
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t pt-2 md:border-t-0 md:pt-0 border-outline/20">
                      <span className="text-[10px] font-mono font-black text-ink-muted uppercase mr-1">
                        {freshness}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          generateAIReply(lead)
                        }}
                        disabled={isPending}
                        className="inline-flex min-h-[34px] items-center gap-1 border-2 border-outline bg-accent px-2.5 py-1 text-[11px] font-black uppercase shadow-brutal-sm hover:bg-yellow-300 disabled:opacity-60"
                      >
                        <Sparkles className="h-3 w-3" />
                        Draft
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClaimBounty(lead)
                        }}
                        disabled={isPending}
                        className={`inline-flex min-h-[34px] items-center gap-1 border-2 border-outline px-2.5 py-1 text-[11px] font-black uppercase shadow-brutal-sm disabled:opacity-60 ${badgeStyle.accent}`}
                      >
                        <Sword className="h-3 w-3" />
                        Claim
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDetailLead(lead)
                        }}
                        className="inline-flex min-h-[34px] items-center justify-center border-2 border-outline bg-card px-2 py-1 text-[10px] font-black uppercase shadow-brutal-sm hover:bg-inset"
                        aria-label="Inspect signal"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            /* RICH GRID VIEW MODE (Clean Card Anatomy with RPG Rarity Left Borders) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedLeads.map((lead, index) => {
                const badge = getSignalBadge(lead)
                const badgeStyle = signalBadgeStyles[badge]
                const platformTone = getPlatformTone(lead.platform)
                const intentDisplay = getIntentDisplay(lead)
                const keywords = getKeywords(lead)
                const freshness = formatTimestamp(lead.sourceCreatedAt)

                return (
                  <motion.article
                    key={`desktop-${lead.id}`}
                    layout
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 25, delay: index * 0.04 }
                    }
                    className={`group flex h-full flex-col overflow-hidden bg-card border-4 border-outline ${badgeStyle.border} shadow-brutal-lg transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg`}
                  >
                    {/* Header Bar */}
                    <div className={`border-b-3 border-outline px-4 py-2.5 ${badgeStyle.wrap}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 border-2 border-outline px-2 py-0.5 text-[11px] font-black uppercase ${badgeStyle.badge} shadow-brutal-sm`}>
                            {badge === 'LIVE_SCORED' ? <Crown className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                            {badgeStyle.label}
                          </span>

                          <span className={`inline-flex items-center gap-1 border-2 border-outline px-2 py-0.5 text-[11px] font-black uppercase shadow-brutal-sm ${platformTone.chip}`}>
                            {platformTone.icon}
                            {platformTone.label}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono font-black uppercase tracking-wider text-ink/70">
                          {freshness}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 gap-4">
                      <div className="space-y-3">
                        {/* Aurora's verdict, or an explicit absence of one. */}
                        <div className="flex flex-wrap items-center gap-2">
                          {intentDisplay.kind === 'scored' ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 border-2 border-outline bg-accent px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm">
                                <Crosshair className="h-3.5 w-3.5" />
                                {intentDisplay.score}% intent match
                              </span>
                              <span className="inline-flex items-center gap-1.5 border-2 border-outline bg-info px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm text-on-accent">
                                {intentDisplay.action}
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 border-2 border-outline bg-card px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm text-ink/60">
                              <Crosshair className="h-3.5 w-3.5" />
                              {intentDisplay.label}
                            </span>
                          )}
                        </div>

                        {/* Sentence-Case Lead Quote with Line Clamp 3 */}
                        <p className="text-base font-bold leading-relaxed text-ink line-clamp-3">
                          “{lead.content}”
                        </p>

                        {intentDisplay.kind === 'scored' ? (
                          <div className="border-l-4 border-l-black bg-inset p-3 border-2 border-outline shadow-brutal-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-ink-muted">
                              Tactical read
                            </p>
                            <p className="mt-1 text-xs font-bold leading-relaxed text-ink">
                              {getTacticalRead(intentDisplay)}
                            </p>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 border-2 border-outline bg-inset px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink/70 shadow-brutal-sm ${
                              shouldReduceMotion ? '' : 'animate-pulse'
                            }`}
                          >
                            ⚡ Pending Aurora Evaluation
                          </span>
                        )}
                      </div>

                      {/* Keywords Row */}
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.length ? (
                          keywords.map((keyword) => (
                            <span
                              key={`${lead.id}-${keyword}`}
                              className="border-2 border-outline bg-highlight-strong px-2 py-0.5 text-[10px] font-mono font-black uppercase shadow-brutal-sm"
                            >
                              #{keyword}
                            </span>
                          ))
                        ) : (
                          <span className="border-2 border-outline bg-card px-2 py-0.5 text-[10px] font-mono font-black uppercase shadow-brutal-sm">
                            #general-intent
                          </span>
                        )}
                      </div>

                      {/* Action Buttons Row - Positioned INSIDE Card Flex Container */}
                      <div className="mt-auto pt-3 border-t-2 border-outline space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => generateAIReply(lead)}
                            disabled={isPending}
                            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 border-3 border-outline bg-accent px-3 py-2 text-xs font-black uppercase shadow-brutal-sm hover:bg-yellow-300 disabled:opacity-60 transition active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Cast AI draft
                          </button>

                          <button
                            type="button"
                            onClick={() => handleClaimBounty(lead)}
                            disabled={isPending}
                            className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 border-3 border-outline px-3 py-2 text-xs font-black uppercase shadow-brutal-sm disabled:opacity-60 transition active:translate-x-[1px] active:translate-y-[1px] ${badgeStyle.accent}`}
                          >
                            <Sword className="h-3.5 w-3.5" />
                            Claim lead
                          </button>
                        </div>

                        {/* Collapsed Secondary Action Controls */}
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-ink underline-offset-4 hover:underline"
                          >
                            {isSampleQuest(lead) ? 'Add keyword' : 'Inspect thread'}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </a>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => exportToCRM(lead)}
                              disabled={isPending}
                              title="Export lead to CRM"
                              className="inline-flex min-h-[32px] items-center gap-1 border-2 border-outline bg-card px-2 py-1 text-[10px] font-black uppercase shadow-brutal-sm hover:bg-accent disabled:opacity-60"
                            >
                              <Coins className="h-3 w-3" />
                              CRM
                            </button>

                            <button
                              type="button"
                              onClick={() => dismissLead(lead.id)}
                              disabled={isPending}
                              title="Dismiss lead from queue"
                              aria-label={`Dismiss ${lead.author || 'lead'}`}
                              className="inline-flex min-h-[32px] items-center gap-1 border-2 border-outline bg-inset px-2 py-1 text-[10px] font-black uppercase shadow-brutal-sm hover:bg-rose-100 text-rose-800 disabled:opacity-60"
                            >
                              <X className="h-3 w-3" />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <EmptyRadarState handlePresetClick={handlePresetClick} />
      )}

      {/* EXPANDABLE DETAIL DRAWER / BOTTOM SHEET (PROGRESSIVE DISCLOSURE FOR MOBILE) */}
      <AnimatePresence>
        {activeDetailLead && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-[2px]">
            <motion.div
              ref={detailDialogRef}
              initial={shouldReduceMotion ? false : { y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { y: '100%', opacity: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 25, stiffness: 280 }
              }
              className="w-full max-w-xl max-h-[85dvh] overflow-y-auto border-t-4 sm:border-4 border-outline bg-highlight p-4 sm:p-6 shadow-[0_-8px_0_0_#000] sm:shadow-brutal-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-detail-title"
              aria-label="Lead detail"
            >
              <div className="flex items-center justify-between border-b-3 border-outline pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    id="lead-detail-title"
                    className="border-2 border-outline bg-accent px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm"
                  >
                    Lead detail
                  </span>
                  <span className="text-xs font-bold uppercase text-ink/70">
                    {formatTimestamp(activeDetailLead.sourceCreatedAt)}
                  </span>
                </div>
                <button
                  ref={detailCloseRef}
                  type="button"
                  onClick={() => setActiveDetailLead(null)}
                  className="flex h-11 w-11 items-center justify-center border-2 border-outline bg-card text-ink shadow-brutal-sm"
                  aria-label="Close detail sheet"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Intent & Value Banner */}
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const detailIntent = getIntentDisplay(activeDetailLead)
                    if (detailIntent.kind !== 'scored') {
                      return (
                        <div className="inline-flex items-center gap-1.5 border-2 border-outline bg-card px-3 py-1 text-xs font-black uppercase shadow-brutal-sm text-ink/60">
                          <Crosshair className="h-4 w-4" />
                          {detailIntent.label}
                        </div>
                      )
                    }
                    return (
                      <>
                        <div className="inline-flex items-center gap-1.5 border-2 border-outline bg-accent px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
                          <Crosshair className="h-4 w-4" />
                          {detailIntent.score}% intent match
                        </div>
                        <div className="inline-flex items-center gap-1.5 border-2 border-outline bg-info px-3 py-1 text-xs font-black uppercase shadow-brutal-sm text-on-accent">
                          {detailIntent.action}
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Full Quote Content */}
                <div className="border-3 border-outline bg-card p-4 shadow-brutal">
                  <p className="text-xs font-black uppercase text-ink/50 mb-1">Raw Signal Content</p>
                  <p className="text-base font-black uppercase leading-relaxed text-ink">
                    “{activeDetailLead.content}”
                  </p>
                  {activeDetailLead.author && (
                    <p className="mt-2 text-xs font-bold text-ink/70 uppercase">
                      Author: @{activeDetailLead.author}
                    </p>
                  )}
                </div>

                {/* Tactical Read Analysis — scored only; unscored stays a compact pulse tag */}
                {(() => {
                  const detailIntent = getIntentDisplay(activeDetailLead)
                  if (detailIntent.kind !== 'scored') {
                    return (
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 border-2 border-outline bg-inset px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink/70 shadow-brutal-sm ${
                          shouldReduceMotion ? '' : 'animate-pulse'
                        }`}
                      >
                        ⚡ Pending Aurora Evaluation
                      </span>
                    )
                  }
                  return (
                    <div className="border-l-4 border-outline bg-highlight p-4 border-3 border-outline shadow-brutal-sm">
                      <p className="text-xs font-black uppercase tracking-wider text-ink/60">
                        Tactical read & Buyer state
                      </p>
                      <p className="mt-1.5 text-xs font-bold leading-relaxed text-ink/90">
                        {getTacticalRead(detailIntent)}
                      </p>
                    </div>
                  )
                })()}

                {/* Matched Keywords */}
                <div className="flex flex-wrap gap-2">
                  {getKeywords(activeDetailLead).map((keyword) => (
                    <span
                      key={`modal-${keyword}`}
                      className="border-2 border-outline bg-highlight-strong px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>

                {/* Action Suite */}
                <div className="border-t-3 border-outline pt-4 space-y-3">
                  <a
                    href={activeDetailLead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border-2 border-outline bg-card p-3 text-xs font-black uppercase shadow-brutal-sm hover:bg-accent"
                  >
                    <span>
                      {isSampleQuest(activeDetailLead) ? 'Add a real keyword' : 'Inspect source thread'}
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        generateAIReply(activeDetailLead)
                        setActiveDetailLead(null)
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-outline bg-accent px-3 py-2.5 text-xs font-black uppercase shadow-brutal-sm hover:bg-yellow-300"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Reply
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleClaimBounty(activeDetailLead)
                        setActiveDetailLead(null)
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-outline bg-accent-2 px-3 py-2.5 text-xs font-black uppercase text-white shadow-brutal-sm"
                    >
                      <Sword className="h-4 w-4" />
                      Claim Lead
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        exportToCRM(activeDetailLead)
                        setActiveDetailLead(null)
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-outline bg-card px-3 py-2.5 text-xs font-black uppercase shadow-brutal-sm hover:bg-accent"
                    >
                      <Coins className="h-4 w-4" />
                      Export to CRM
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        dismissLead(activeDetailLead.id)
                        setActiveDetailLead(null)
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center border-3 border-outline bg-[#F3E5E5] px-4 py-2.5 text-xs font-black uppercase shadow-brutal-sm hover:bg-[#F7C7C7]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

const DashboardFeed = memo(DashboardFeedComponent)
export default DashboardFeed
