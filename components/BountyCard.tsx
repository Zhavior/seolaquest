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
    ? 'bg-[#06B6D4] text-black'
    : isReddit
      ? 'bg-[#FF5722] text-white'
      : 'bg-[#A3E635] text-black'
  const contentStyle = isTwitter
    ? 'bg-[#F0F9FF] border-l-8 border-[#06B6D4]'
    : isReddit
      ? 'bg-[#FFF7ED] border-l-8 border-[#FF5722]'
      : 'bg-[#F4F0EA]'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex flex-col justify-between overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0_0_#000]"
    >
      <header className="border-b-4 border-black bg-black p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1.5 border border-white/40 px-2 py-0.5 text-[10px] font-black uppercase ${badgeStyle}`}>
              {isTwitter && <XTwitterIcon className="h-3.5 w-3.5" />}
              {isReddit && <RedditIcon className="h-3.5 w-3.5" />}
              {isTwitter ? 'TWITTER (X)' : isReddit ? 'REDDIT' : lead.platform}
            </span>
            <p className="mt-2 truncate text-lg font-black">{lead.author}</p>
          </div>
          <span className="shrink-0 border-2 border-white bg-zinc-800 px-2 py-1 text-[10px] font-black uppercase">
            Stored source record
          </span>
        </div>
      </header>

      <div className={`flex-1 p-6 ${contentStyle}`}>
        <p className="text-lg font-bold leading-relaxed text-gray-900">&quot;{lead.content}&quot;</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="border-2 border-black bg-[#FFE600] px-2.5 py-1 text-xs font-black uppercase">
            Source match: {lead.matched}
          </span>
          <span className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase">
            {ageLabel(lead.sourceCreatedAt)}
          </span>
        </div>
        <p className="mt-4 text-xs font-bold leading-relaxed text-zinc-600">
          CoQuest has not measured an intent score, social engagement count, deal value, or response SLA for this record.
        </p>
      </div>

      <div className="space-y-3 border-t-4 border-black bg-white p-4">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sfx.playCoinDrop()
              onClaim(lead)
            }}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-[#A3E635] py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Swords className="h-5 w-5" /> Mark contacted
          </motion.button>
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open stored source post by ${lead.author} in a new tab`}
            className="flex min-h-11 w-14 items-center justify-center border-4 border-black bg-[#06B6D4] shadow-[4px_4px_0_0_#000]"
          >
            <ExternalLink aria-hidden="true" className="h-6 w-6 stroke-[3px]" />
          </a>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenerateAIReply(lead)}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-[#A855F7] py-2 text-xs font-black uppercase text-black shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" /> Request AI draft
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onExportToCRM(lead)}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-black py-2 text-xs font-black uppercase text-white shadow-[4px_4px_0_0_#A3E635] disabled:cursor-not-allowed disabled:opacity-50"
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
        className="absolute left-1/2 top-2 z-20 flex min-h-11 min-w-11 -translate-x-1/2 items-center justify-center border-2 border-black bg-red-500 p-2 text-white shadow-[2px_2px_0_0_#000]"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>
    </motion.article>
  )
}
