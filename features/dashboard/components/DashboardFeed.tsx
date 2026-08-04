'use client'

import { memo } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Flame,
  Radar,
  Crosshair,
  Sparkles,
  Coins,
  Sword,
  ShieldAlert,
  ChevronRight,
  Crown,
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
    wrap: 'bg-[#F6F0E4]',
    badge: 'bg-[#E7E1D4] text-[#3F352A]',
    accent: 'bg-[#3F352A]',
  },
  RARE: {
    label: 'RARE SIGNAL',
    wrap: 'bg-[#FFF5CC]',
    badge: 'bg-[#FFE082] text-black',
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
    badge: 'bg-[#FFB86A] text-black',
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
    chip: 'bg-[#F4F0EA] text-black',
  }
}

function getLeadTier(lead: DashboardLead): LootTier {
  const body = `${lead.content} ${lead.matched}`.toLowerCase()

  if (
    /budget|pricing|quote|urgent|asap|need now|ready to switch|alternative|migration|demo/i.test(body)
  ) {
    return 'LEGENDARY'
  }

  if (/compare|comparison|best|recommend|stack|replace|versus|vs\\.?/i.test(body)) {
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
    <div className="relative mt-6 overflow-hidden border-2 border-black bg-[#FFF9EC] p-6 shadow-none md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,#00000014_1px,transparent_1px),linear-gradient(to_bottom,#00000014_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-black bg-[#FFE082] shadow-[4px_4px_0_#000]">
          <div className="absolute inset-3 rounded-full border-2 border-black/20" />
          <div className="absolute inset-6 rounded-full border-2 border-black/15" />
          <div className="absolute h-[2px] w-12 origin-left -rotate-12 bg-black animate-pulse" />
          <Radar className="relative z-10 h-12 w-12 text-black" />
        </div>

        <div className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[2px_2px_0_#000]">
          <ShieldAlert className="h-4 w-4" />
          No active signals in queue
        </div>

        <h3 className="mt-6 text-[clamp(1.5rem,3vw,2.25rem)] font-black uppercase tracking-tight text-black leading-none">
          Arm a keyword and cast your first scan
        </h3>

        <p className="mt-4 max-w-2xl text-[clamp(0.875rem,1.5vw,1rem)] font-bold leading-relaxed text-black/65">
          Your loot board wakes up when the hunt begins. Target buyer pain, comparison intent, and replacement language to reveal high-value leads.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['hubspot alternative', 'looking for crm', 'pipeline analytics'].map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handlePresetClick(phrase)}
              className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#000] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFF1BE] min-h-[44px]"
            >
              {phrase}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handlePresetClick('looking for crm')}
          className="mt-6 inline-flex min-h-[44px] items-center gap-3 border-2 border-black bg-[#FF5C00] px-6 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
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
  return (
    <motion.section
      variants={item}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden border-2 border-black bg-[#FFF9EC] p-6 md:p-8 shadow-[4px_4px_0_#000]"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="mt-1 border-2 border-black bg-[#FF5C00] p-3 shadow-[2px_2px_0_#000] md:p-4">
            <Flame className="h-7 w-7 text-white md:h-9 md:w-9" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border-2 border-black bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] shadow-[2px_2px_0_#000]">
                Zone 04
              </span>
              <span className="border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[2px_2px_0_#000]">
                Live Hunt & Loot Board
              </span>
            </div>

            <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.5rem)] font-black uppercase tracking-tight text-black leading-none">
              Battle-ready signal queue
            </h2>

            <p className="mt-4 max-w-3xl text-[clamp(0.875rem,1.5vw,1rem)] font-bold leading-relaxed text-black/65">
              Every card is an active buying signal. Prioritize high-intent loot, cast AI replies fast, and convert fresh market pain into claimed revenue.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE082] px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#000]">
                <Crosshair className="h-4 w-4" />
                {filteredLeads.length} active {filteredLeads.length === 1 ? 'signal' : 'signals'}
              </div>

              <div className="inline-flex items-center gap-2 border-2 border-black bg-[#C7FFF3] px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#000]">
                <Sparkles className="h-4 w-4" />
                Fresh intent only
              </div>

              <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#000]">
                <Coins className="h-4 w-4" />
                Revenue-ranked battle flow
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const normalized = platform.toUpperCase()
            const isTw = normalized.includes('TWITTER') || normalized.includes('X')
            const isRd = normalized.includes('REDDIT')

            return (
              <button
                key={platform}
                type="button"
                onClick={() => setFilter(platform)}
                className={`flex min-h-[44px] items-center gap-2 border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  filter === platform ? 'bg-[#FFE600] text-black' : 'bg-white text-black hover:bg-[#F3E7C5]'
                }`}
              >
                {isTw ? <XTwitterIcon className="h-4 w-4 text-black" /> : null}
                {isRd ? <RedditIcon className="h-4 w-4 text-[#FF5722]" /> : null}
                {platform === 'TWITTER' ? 'TWITTER / X' : platform}
              </button>
            )
          })}
        </div>
      </div>

      {filteredLeads.length ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredLeads.map((lead, index) => {
            const tier = getLeadTier(lead)
            const tierStyle = tierStyles[tier]
            const platformTone = getPlatformTone(lead.platform)
            const intentScore = getIntentScore(lead)
            const estimatedArr = getEstimatedArr(lead)
            const keywords = getKeywords(lead)
            const freshness = formatTimestamp(lead.sourceCreatedAt)
            const isLegendary = tier === 'LEGENDARY'

            return (
              <motion.article
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
                className={`group flex h-full flex-col overflow-hidden bg-[#FFFDF7] ${isLegendary ? 'border-4 border-black shadow-[8px_8px_0_#000] z-10' : 'border-2 border-black shadow-[4px_4px_0_#000]'} transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_#000]`}
              >
                <div className={`border-b-2 border-black px-4 py-3 ${tierStyle.wrap}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-black uppercase ${tierStyle.badge} shadow-[2px_2px_0_#000]`}>
                        {isLegendary ? <Crown className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {tierStyle.label}
                      </span>

                      <span className={`inline-flex items-center gap-2 border-2 border-black px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#000] ${platformTone.chip}`}>
                        {platformTone.icon}
                        {platformTone.label}
                      </span>
                    </div>

                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">
                      {freshness}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] px-2.5 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0_#000]">
                      <Crosshair className="h-4 w-4" />
                      {intentScore}% intent match
                    </div>

                    <div className="inline-flex items-center gap-2 border-2 border-black bg-[#C7FFF3] px-2.5 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0_#000]">
                      <Coins className="h-4 w-4" />
                      ${estimatedArr.toLocaleString()} ARR est.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[clamp(1.125rem,2vw,1.25rem)] font-black uppercase leading-relaxed text-black">
                      “{lead.content}”
                    </p>

                    <div className="border-l-4 border-black bg-black/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/50">
                        Tactical read
                      </p>
                      <p className="mt-2 text-sm font-bold leading-relaxed text-black/80">
                        {intentScore >= 90
                          ? 'Urgent buyer language detected. This looks close to an active switch decision with strong commercial intent.'
                          : intentScore >= 80
                            ? 'Comparison or replacement intent is present. Good candidate for a fast reply and immediate claim flow.'
                            : intentScore >= 70
                              ? 'Problem-aware prospect with relevant keywords. Worth drafting early before the thread goes cold.'
                              : 'Early-stage market pain mention. Lower urgency, but still useful for visibility and pattern tracking.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {keywords.length ? (
                      keywords.map((keyword) => (
                        <span
                          key={`${lead.id}-${keyword}`}
                          className="border-2 border-black bg-[#FFF4BF] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#000]"
                        >
                          #{keyword}
                        </span>
                      ))
                    ) : (
                      <span className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#000]">
                        #general-intent
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-black bg-[#FFFDF7] p-5">
                  <div className="flex flex-col gap-4">
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black uppercase text-black/70 underline-offset-4 transition hover:text-black hover:underline"
                    >
                      Inspect source thread
                      <ChevronRight className="h-4 w-4" />
                    </a>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => generateAIReply(lead)}
                        disabled={isPending}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 border-2 border-black bg-[#FFE600] px-4 py-3 text-xs font-black uppercase shadow-[2px_2px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#FFD54F]"
                      >
                        <Sparkles className="h-4 w-4" />
                        Cast AI draft
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClaimBounty(lead)}
                        disabled={isPending}
                        className={`inline-flex min-h-[44px] items-center justify-center gap-2 border-2 border-black px-4 py-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${tierStyle.accent}`}
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
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 text-[11px] font-black uppercase shadow-[2px_2px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#FFF1BE] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Coins className="h-4 w-4" />
                        Export to CRM
                      </button>

                      <button
                        type="button"
                        onClick={() => dismissLead(lead.id)}
                        disabled={isPending}
                        aria-label={`Discard ${lead.author || 'lead'}`}
                        className="inline-flex min-h-[44px] items-center justify-center border-2 border-black bg-[#F3E5E5] px-4 py-3 text-[11px] font-black uppercase shadow-[2px_2px_0_#000] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#F7C7C7] disabled:cursor-not-allowed disabled:opacity-60"
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
      ) : (
        <EmptyRadarState handlePresetClick={handlePresetClick} />
      )}
    </motion.section>
  )
}

const DashboardFeed = memo(DashboardFeedComponent)
export default DashboardFeed
