'use client'

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
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
  SlidersHorizontal,
} from 'lucide-react'
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

type LootTier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

const tierStyles: Record<LootTier, { label: string; wrap: string; badge: string; accent: string }> = {
  COMMON: {
    label: 'COMMON DROP',
    wrap: 'bg-[#FFF8D9]',
    badge: 'bg-[#E7E1D4] text-[#3F352A]',
    accent: 'bg-[#3F352A]',
  },
  RARE: {
    label: 'RARE SIGNAL',
    wrap: 'bg-[#FFF5CC]',
    badge: 'bg-[#FFE600] text-black',
    accent: 'bg-[#D5A100]',
  },
  EPIC: {
    label: 'EPIC INTENT',
    wrap: 'bg-[#F7E9FF]',
    badge: 'bg-[#D9B8FF] text-[#2B1245]',
    accent: 'bg-[#7C3AED]',
  },
  LEGENDARY: {
    label: 'LEGENDARY LEAD',
    wrap: 'bg-[#FFE3C7]',
    badge: 'bg-[#FF5C00] text-white',
    accent: 'bg-[#FF5C00]',
  },
}

function getPlatformTone(platform: string) {
  const normalized = platform.toUpperCase()

  if (normalized.includes('REDDIT')) {
    return {
      label: 'REDDIT',
      icon: <RedditIcon className="h-4 w-4 text-[#FF5722]" />,
      chip: 'bg-white text-black',
    }
  }

  if (normalized.includes('TWITTER') || normalized.includes('X')) {
    return {
      label: 'TWITTER / X',
      icon: <XTwitterIcon className="h-4 w-4 text-black" />,
      chip: 'bg-black text-white',
    }
  }

  return {
    label: normalized,
    icon: <Crosshair className="h-4 w-4 text-black" />,
    chip: 'bg-[#FFF8D9] text-black',
  }
}

function getLeadTier(lead: DashboardLead): LootTier {
  const body = `${lead.content} ${lead.matched}`.toLowerCase()

  if (
    /budget|pricing|quote|urgent|asap|need now|ready to switch|alternative|migration|demo/i.test(body)
  ) {
    return 'LEGENDARY'
  }

  if (/compare|comparison|best|recommend|stack|replace|versus|vs\./i.test(body)) {
    return 'EPIC'
  }

  if (/looking for|searching for|tool for|software for|crm|analytics|workflow|automation/i.test(body)) {
    return 'RARE'
  }

  return 'COMMON'
}

function getIntentScore(lead: DashboardLead) {
  const body = `${lead.content} ${lead.matched}`.toLowerCase()

  let score = 58
  if (/budget|pricing|quote|urgent|asap|switch/i.test(body)) score += 24
  if (/alternative|compare|best|recommend|looking for/i.test(body)) score += 12
  if ((lead.matched || '').split(',').filter(Boolean).length >= 2) score += 6

  return Math.min(score, 98)
}

function getEstimatedArr(lead: DashboardLead) {
  const score = getIntentScore(lead)

  if (score >= 92) return 4800
  if (score >= 84) return 2400
  if (score >= 72) return 1200
  return 600
}

function getKeywords(lead: DashboardLead) {
  return lead.matched
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
}

function formatTimestamp(sourceCreatedAt: string | null) {
  if (!sourceCreatedAt) return 'Fresh ping'

  const created = new Date(sourceCreatedAt).getTime()
  if (Number.isNaN(created)) return 'Fresh ping'

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
    <div className="relative mt-6 overflow-hidden border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000] md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,#00000014_1px,transparent_1px),linear-gradient(to_bottom,#00000014_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-black bg-[#FFE600] shadow-[6px_6px_0_0_#000]">
          <div className="absolute inset-3 rounded-full border-2 border-black/20" />
          <div className="absolute inset-6 rounded-full border-2 border-black/15" />
          <div className="absolute h-[2px] w-12 origin-left -rotate-12 bg-black animate-pulse" />
          <Radar className="relative z-10 h-12 w-12 text-black" />
        </div>

        <div className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#FFE600] shadow-[3px_3px_0_0_#000]">
          <ShieldAlert className="h-4 w-4" />
          No active signals in queue
        </div>

        <h3 className="mt-6 text-3xl md:text-4xl font-black uppercase tracking-tight text-black leading-none">
          Arm a keyword and cast your first scan
        </h3>

        <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-black/75">
          Your loot board wakes up when the hunt begins. Target buyer pain, comparison intent, and replacement language to reveal high-value leads.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['hubspot alternative', 'looking for crm', 'pipeline analytics'].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handlePresetClick(phrase)}
              className="border-3 border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFE600] min-h-[44px]"
            >
              {phrase}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handlePresetClick('looking for crm')}
          className="mt-6 inline-flex min-h-[44px] items-center gap-3 border-4 border-black bg-[#FF5722] px-6 py-3 text-sm font-black uppercase text-white shadow-[6px_6px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_0_#000]"
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

  const displayedLeads = useMemo(() => {
    if (!searchQuery.trim()) return filteredLeads
    const q = searchQuery.toLowerCase()
    return filteredLeads.filter(
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
      className="relative overflow-hidden border-4 border-black bg-[#FFF8D9] p-4 sm:p-6 md:p-8 shadow-[6px_6px_0_0_#000]"
    >
      {/* Resilient Warming / Stale Data Indicator */}
      {isPending && (
        <div className="mb-4 flex items-center justify-between border-3 border-black bg-[#FFE600] px-3.5 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-black" />
            WARMING RADAR SIGNAL... PRESERVING ACTIVE STATE
          </span>
          <span className="hidden sm:inline-block border border-black bg-black text-[#FFE600] px-2 py-0.5 text-[10px]">
            LIVE REFRESH
          </span>
        </div>
      )}

      {/* Compact Header & Controls */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="mt-1 border-4 border-black bg-[#FF5722] p-2.5 shadow-[3px_3px_0_0_#000] sm:p-4 sm:shadow-[4px_4px_0_0_#000]">
            <Flame className="h-6 w-6 text-white sm:h-10 sm:w-10" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-black text-[#FFE600] uppercase text-[10px] sm:text-xs font-black tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 border-2 border-black -rotate-1">
                ZONE 04 — LIVE HUNT & LOOT BOARD
              </span>
            </div>

            <h2
              className="text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] mt-0.5"
              style={{ WebkitTextStroke: '1.5px black' }}
            >
              Battle-Ready Signal Queue
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 border-2 sm:border-3 border-black bg-[#FFE600] px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]">
                <Crosshair className="h-3.5 w-3.5" />
                {displayedLeads.length} {displayedLeads.length === 1 ? 'signal' : 'signals'}
              </div>

              <div className="inline-flex items-center gap-1.5 border-2 sm:border-3 border-black bg-[#06B6D4] px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000] text-black">
                <Sparkles className="h-3.5 w-3.5" />
                Fresh intent
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Search Row & Horizontally Scrollable Tactical Filters */}
      <div className="mb-6 space-y-3">
        {/* Full-width Search Bar */}
        <div className="relative flex items-center border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
          <Search className="absolute left-3.5 h-4 w-4 text-black/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH SIGNALS, PLAYERS, KEYWORDS..."
            className="w-full bg-transparent py-2.5 pl-10 pr-10 text-xs sm:text-sm font-black uppercase text-black placeholder:text-black/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-black/60 hover:text-black"
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
                className={`flex shrink-0 min-h-[40px] items-center gap-2 border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  filter === platform ? 'bg-[#FFE600] text-black' : 'bg-white text-black hover:bg-[#FFE600]'
                }`}
              >
                {isTw ? <XTwitterIcon className="h-3.5 w-3.5 text-black" /> : null}
                {isRd ? <RedditIcon className="h-3.5 w-3.5 text-[#FF5722]" /> : null}
                {platform === 'TWITTER' ? 'TWITTER / X' : platform}
              </button>
            )
          })}
        </div>
      </div>

      {displayedLeads.length ? (
        <>
          {/* MOBILE PRESENTATION LAYER (1-column compact card stack with progressive disclosure) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {displayedLeads.map((lead) => {
              const tier = getLeadTier(lead)
              const tierStyle = tierStyles[tier]
              const platformTone = getPlatformTone(lead.platform)
              const intentScore = getIntentScore(lead)
              const freshness = formatTimestamp(lead.sourceCreatedAt)

              return (
                <article
                  key={`mobile-${lead.id}`}
                  className="flex flex-col border-4 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden"
                >
                  {/* Compact Header: Max 4 Key Data Points */}
                  <div className={`border-b-3 border-black p-3 ${tierStyle.wrap} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center gap-1 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase ${tierStyle.badge} shadow-[1.5px_1.5px_0_0_#000]`}>
                        {platformTone.icon}
                        {platformTone.label}
                      </span>
                      <span className="text-[10px] font-black uppercase border border-black bg-black text-[#FFE600] px-1.5 py-0.5 shrink-0">
                        {intentScore}% MATCH
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-black/70 shrink-0">
                      {freshness}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-black uppercase line-clamp-2 leading-snug text-black">
                      “{lead.content}”
                    </p>
                    {lead.author && (
                      <p className="text-[11px] font-bold text-black/60 uppercase">
                        Source: @{lead.author}
                      </p>
                    )}
                  </div>

                  {/* Single Primary CTA for Mobile Card */}
                  <div className="border-t-3 border-black bg-[#FFF8D9] p-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDetailLead(lead)}
                      className="flex-1 inline-flex min-h-[40px] items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] active:translate-y-0.5 hover:bg-yellow-300"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Inspect & Action
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaimBounty(lead)}
                      disabled={isPending}
                      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 border-3 border-black px-3 py-2 text-xs font-black uppercase text-white shadow-[2px_2px_0_0_#000] ${tierStyle.accent}`}
                    >
                      <Sword className="h-3.5 w-3.5" />
                      Claim
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {/* DESKTOP PRESENTATION LAYER (Rich multi-column grid retained for md/lg+) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLeads.map((lead, index) => {
              const tier = getLeadTier(lead)
              const tierStyle = tierStyles[tier]
              const platformTone = getPlatformTone(lead.platform)
              const intentScore = getIntentScore(lead)
              const estimatedArr = getEstimatedArr(lead)
              const keywords = getKeywords(lead)
              const freshness = formatTimestamp(lead.sourceCreatedAt)

              return (
                <motion.article
                  key={`desktop-${lead.id}`}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.04 }}
                  className="group flex h-full flex-col overflow-hidden bg-white border-4 border-black shadow-[6px_6px_0_0_#000] transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#000]"
                >
                  <div className={`border-b-4 border-black px-4 py-3 ${tierStyle.wrap}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 border-2 border-black px-2.5 py-1 text-xs font-black uppercase ${tierStyle.badge} shadow-[2px_2px_0_0_#000]`}>
                          {tier === 'LEGENDARY' ? <Crown className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                          {tierStyle.label}
                        </span>

                        <span className={`inline-flex items-center gap-2 border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] ${platformTone.chip}`}>
                          {platformTone.icon}
                          {platformTone.label}
                        </span>
                      </div>

                      <span className="text-xs font-black uppercase tracking-wider text-black/70">
                        {freshness}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-5 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
                        <Crosshair className="h-4 w-4" />
                        {intentScore}% intent match
                      </div>

                      <div className="inline-flex items-center gap-2 border-2 border-black bg-[#06B6D4] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] text-black">
                        <Coins className="h-4 w-4" />
                        ${estimatedArr.toLocaleString()} ARR est.
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-lg font-black uppercase leading-relaxed text-black">
                        “{lead.content}”
                      </p>

                      <div className="border-l-4 border-black bg-[#FFF8D9] p-4 border-2 border-black shadow-[3px_3px_0_0_#000]">
                        <p className="text-xs font-black uppercase tracking-wider text-black/60">
                          Tactical read
                        </p>
                        <p className="mt-2 text-xs font-bold leading-relaxed text-black/90">
                          {intentScore >= 90
                            ? 'Urgent buyer language detected. Active switch decision with strong commercial intent.'
                            : intentScore >= 80
                              ? 'Comparison or replacement intent is present. Good candidate for a fast reply.'
                              : intentScore >= 70
                                ? 'Problem-aware prospect with relevant keywords. Worth drafting early.'
                                : 'Early-stage market pain mention. Lower urgency, but useful for visibility.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      {keywords.length ? (
                        keywords.map((keyword) => (
                          <span
                            key={`${lead.id}-${keyword}`}
                            className="border-2 border-black bg-[#FFE082] px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
                          >
                            #{keyword}
                          </span>
                        ))
                      ) : (
                        <span className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
                          #general-intent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t-4 border-black bg-[#FFF8D9] p-5">
                    <div className="flex flex-col gap-4">
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase text-black underline-offset-4 transition hover:underline"
                      >
                        Inspect source thread
                        <ChevronRight className="h-4 w-4" />
                      </a>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => generateAIReply(lead)}
                          disabled={isPending}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 border-3 border-black bg-[#FFE600] px-4 py-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 hover:bg-yellow-300"
                        >
                          <Sparkles className="h-4 w-4" />
                          Cast AI draft
                        </button>

                        <button
                          type="button"
                          onClick={() => handleClaimBounty(lead)}
                          disabled={isPending}
                          className={`inline-flex min-h-[44px] items-center justify-center gap-2 border-3 border-black px-4 py-3 text-xs font-black uppercase text-white shadow-[3px_3px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${tierStyle.accent}`}
                        >
                          <Sword className="h-4 w-4" />
                          Claim lead
                        </button>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <button
                          type="button"
                          onClick={() => exportToCRM(lead)}
                          disabled={isPending}
                          className="inline-flex min-h-[44px] items-center justify-center gap-2 border-3 border-black bg-white px-4 py-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#FFE600] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Coins className="h-4 w-4" />
                          Export to CRM
                        </button>

                        <button
                          type="button"
                          onClick={() => dismissLead(lead.id)}
                          disabled={isPending}
                          aria-label={`Discard ${lead.author || 'lead'}`}
                          className="inline-flex min-h-[44px] items-center justify-center border-3 border-black bg-[#F3E5E5] px-4 py-3 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#F7C7C7] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </>
      ) : (
        <EmptyRadarState handlePresetClick={handlePresetClick} />
      )}

      {/* EXPANDABLE DETAIL DRAWER / BOTTOM SHEET (PROGRESSIVE DISCLOSURE FOR MOBILE) */}
      <AnimatePresence>
        {activeDetailLead && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-[2px]">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-xl max-h-[85dvh] overflow-y-auto border-t-4 sm:border-4 border-black bg-[#FFF8D9] p-4 sm:p-6 shadow-[0_-8px_0_0_#000] sm:shadow-[8px_8px_0_0_#000]"
              role="dialog"
              aria-label="Signal Tactical Detail"
            >
              <div className="flex items-center justify-between border-b-3 border-black pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="border-2 border-black bg-[#FFE600] px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
                    TACTICAL DRILLDOWN
                  </span>
                  <span className="text-xs font-bold uppercase text-black/70">
                    {formatTimestamp(activeDetailLead.sourceCreatedAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailLead(null)}
                  className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000]"
                  aria-label="Close detail sheet"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Intent & Value Banner */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
                    <Crosshair className="h-4 w-4" />
                    {getIntentScore(activeDetailLead)}% intent match
                  </div>

                  <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#06B6D4] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] text-black">
                    <Coins className="h-4 w-4" />
                    ${getEstimatedArr(activeDetailLead).toLocaleString()} ARR est.
                  </div>
                </div>

                {/* Full Quote Content */}
                <div className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
                  <p className="text-xs font-black uppercase text-black/50 mb-1">Raw Signal Content</p>
                  <p className="text-base font-black uppercase leading-relaxed text-black">
                    “{activeDetailLead.content}”
                  </p>
                  {activeDetailLead.author && (
                    <p className="mt-2 text-xs font-bold text-black/70 uppercase">
                      Author: @{activeDetailLead.author}
                    </p>
                  )}
                </div>

                {/* Tactical Read Analysis */}
                <div className="border-l-4 border-black bg-[#FFF8D9] p-4 border-3 border-black shadow-[3px_3px_0_0_#000]">
                  <p className="text-xs font-black uppercase tracking-wider text-black/60">
                    Tactical read & Buyer state
                  </p>
                  <p className="mt-1.5 text-xs font-bold leading-relaxed text-black/90">
                    {getIntentScore(activeDetailLead) >= 90
                      ? 'Urgent buyer language detected. Active switch decision with strong commercial intent.'
                      : getIntentScore(activeDetailLead) >= 80
                        ? 'Comparison or replacement intent is present. Good candidate for a fast reply.'
                        : getIntentScore(activeDetailLead) >= 70
                          ? 'Problem-aware prospect with relevant keywords. Worth drafting early.'
                          : 'Early-stage market pain mention. Lower urgency, but useful for visibility.'}
                  </p>
                </div>

                {/* Matched Keywords */}
                <div className="flex flex-wrap gap-2">
                  {getKeywords(activeDetailLead).map((keyword) => (
                    <span
                      key={`modal-${keyword}`}
                      className="border-2 border-black bg-[#FFE082] px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>

                {/* Action Suite */}
                <div className="border-t-3 border-black pt-4 space-y-3">
                  <a
                    href={activeDetailLead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border-2 border-black bg-white p-3 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] hover:bg-[#FFE600]"
                  >
                    <span>Inspect source thread</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        generateAIReply(activeDetailLead)
                        setActiveDetailLead(null)
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-black bg-[#FFE600] px-3 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] hover:bg-yellow-300"
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
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-black bg-[#FF5722] px-3 py-2.5 text-xs font-black uppercase text-white shadow-[3px_3px_0_0_#000]"
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
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border-3 border-black bg-white px-3 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] hover:bg-[#FFE600]"
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
                      className="inline-flex min-h-[44px] items-center justify-center border-3 border-black bg-[#F3E5E5] px-4 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0_0_#000] hover:bg-[#F7C7C7]"
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
