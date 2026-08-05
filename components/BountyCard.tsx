'use client'

import { motion } from 'framer-motion'
import { Database, ExternalLink, Swords, Trash2, Wand2 } from 'lucide-react'
import { XTwitterIcon, RedditIcon } from '@/components/PlatformIcons'
import { sfx } from '@/lib/sfx'
import type { DashboardLead } from '@/features/dashboard/types'

interface BountyCardProps {
  lead: DashboardLead
  isPending: boolean
  onClaim: (lead: DashboardLead) => void
  onGenerateAIReply: (lead: DashboardLead) => void
  onExportToCRM: (lead: DashboardLead) => void
  onDismiss: (leadId: string) => void
}

function ageLabel(value: string | null) {
  if (!value) return 'Source time unavailable'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Source time unavailable'
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function BountyCard({
  lead,
  isPending,
  onClaim,
  onGenerateAIReply,
  onExportToCRM,
  onDismiss,
}: BountyCardProps) {
  const normalizedPlatform = lead.platform.toUpperCase()
  const isTwitter = normalizedPlatform.includes('TWITTER') || normalizedPlatform === 'X'
  const isReddit = normalizedPlatform.includes('REDDIT')
  const badgeStyle = isTwitter
    ? 'bg-info text-on-accent'
    : isReddit
      ? 'bg-accent-2 text-white'
      : 'bg-success text-on-accent'
  const contentStyle = isTwitter
    ? 'bg-[#F0F9FF] border-l-8 border-[#06B6D4]'
    : isReddit
      ? 'bg-[#FFF7ED] border-l-8 border-[#FF5722]'
      : 'bg-canvas'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex flex-col justify-between overflow-hidden border-4 border-outline bg-card shadow-brutal-lg"
    >
      <header className="border-b-4 border-outline bg-black p-3.5 sm:p-4 text-white">
        <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1.5 border border-white/40 px-2 py-0.5 text-[10px] font-black uppercase ${badgeStyle}`}>
              {isTwitter && <XTwitterIcon className="h-3.5 w-3.5" />}
              {isReddit && <RedditIcon className="h-3.5 w-3.5" />}
              {isTwitter ? 'TWITTER (X)' : isReddit ? 'REDDIT' : lead.platform}
            </span>
            <p className="mt-1.5 truncate text-base sm:text-lg font-black">{lead.author}</p>
          </div>
          <span className="shrink-0 border-2 border-white bg-zinc-800 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase">
            Stored source record
          </span>
        </div>
      </header>

      <div className={`flex-1 p-4 sm:p-6 ${contentStyle}`}>
        <p className="text-base sm:text-lg font-bold leading-relaxed text-ink break-word-safe">&quot;{lead.content}&quot;</p>
        <div className="mt-4 sm:mt-5 flex flex-wrap gap-2">
          <span className="border-2 border-outline bg-accent px-2.5 py-1 text-xs font-black uppercase break-word-safe">
            Source match: {lead.matched}
          </span>
          <span className="border-2 border-outline bg-card px-2.5 py-1 text-xs font-black uppercase">
            {ageLabel(lead.sourceCreatedAt)}
          </span>
        </div>
        <p className="mt-3 sm:mt-4 text-xs font-bold leading-relaxed text-ink-muted">
          CoQuest has not measured an intent score, social engagement count, deal value, or response SLA for this record.
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3 border-t-4 border-outline bg-card p-3.5 sm:p-4">
        <div className="flex gap-2.5 sm:gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sfx.playCoinDrop()
              onClaim(lead)
            }}
            disabled={isPending}
            className="flex flex-1 min-h-[44px] items-center justify-center gap-2 border-4 border-outline bg-success py-2.5 text-xs sm:text-sm font-black uppercase text-on-accent shadow-brutal-sm sm:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Swords className="h-4 w-4 sm:h-5 sm:w-5" /> Mark contacted
          </motion.button>
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open stored source post by ${lead.author} in a new tab`}
            className="flex min-h-[44px] w-12 sm:w-14 items-center justify-center border-4 border-outline bg-info shadow-brutal-sm sm:shadow-brutal"
          >
            <ExternalLink aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3px]" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenerateAIReply(lead)}
            disabled={isPending}
            className="flex flex-1 min-h-[44px] items-center justify-center gap-2 border-4 border-outline bg-[#A855F7] py-2 text-xs font-black uppercase text-on-accent shadow-brutal-sm sm:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" /> Request AI draft
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onExportToCRM(lead)}
            disabled={isPending}
            className="flex flex-1 min-h-[44px] items-center justify-center gap-2 border-4 border-outline bg-black py-2 text-xs font-black uppercase text-white shadow-[3px_3px_0_0_#A3E635] sm:shadow-[4px_4px_0_0_#A3E635] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Database className="h-4 w-4" /> Queue CRM export
          </motion.button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(lead.id)}
        disabled={isPending}
        aria-label={`Dismiss source match from ${lead.author}`}
        className="absolute left-1/2 top-2 z-20 flex min-h-11 min-w-11 -translate-x-1/2 items-center justify-center border-2 border-outline bg-red-500 p-2 text-white shadow-brutal-sm"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>
    </motion.article>
  )
}
