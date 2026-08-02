'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Database, ExternalLink, Lock, Swords, Trash2, Wand2 } from 'lucide-react'
import { XTwitterIcon, RedditIcon } from '@/components/PlatformIcons'
import { getMonsterForLead, MonsterTier } from '@/lib/monsterTiers'
import { sfx } from '@/lib/sfx'
import type { DashboardLead, DashboardUser } from '@/features/dashboard/types'

interface BountyCardProps {
  lead: DashboardLead
  user: DashboardUser
  isPending: boolean
  onClaim: (lead: DashboardLead, xpReward: number) => void
  onGenerateAIReply: (lead: DashboardLead) => void
  onExportToCRM: (lead: DashboardLead) => void
  onDismiss: (leadId: string) => void
}

function ageLabel(value: string | null) {
  if (!value) return 'Recently found'
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function getIntentScore(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return 85 + (Math.abs(hash) % 13)
}

export default function BountyCard({
  lead,
  user,
  isPending,
  onClaim,
  onGenerateAIReply,
  onExportToCRM,
  onDismiss,
}: BountyCardProps) {
  const monster: MonsterTier = getMonsterForLead(lead)
  const intentScore = getIntentScore(lead.id)
  const isTwitter = lead.platform.toUpperCase().includes('TWITTER') || lead.platform.toUpperCase().includes('X')
  const isReddit = lead.platform.toUpperCase().includes('REDDIT')

  const badgeBg = isTwitter ? 'bg-[#06B6D4] text-black' : isReddit ? 'bg-[#FF5722] text-white' : 'bg-[#A3E635] text-black'
  const headerBg = isTwitter ? 'bg-[#0F1419]' : isReddit ? 'bg-[#1A1A1B]' : 'bg-black'
  const authorDisplay = isTwitter 
    ? `@${lead.author.replace(/^@/, '')}` 
    : isReddit 
    ? (lead.author.startsWith('u/') ? lead.author : `u/${lead.author}`) 
    : lead.author

  // Boss Aura Logic for Tiers 33-50 (Mythic, God-Tier & Cosmic)
  const isBossAura = monster.tier >= 33
  let bossGlowClasses = ''
  if (isBossAura) {
    if (monster.rankGroup === 'COSMIC') {
      bossGlowClasses = 'animate-pulse shadow-[0_0_25px_rgba(255,230,0,0.95)] border-4 border-[#FFE600]'
    } else if (monster.rankGroup === 'GOD_TIER') {
      bossGlowClasses = 'animate-pulse shadow-[0_0_22px_rgba(0,240,255,0.90)] border-4 border-[#00F0FF]'
    } else {
      // MYTHIC
      bossGlowClasses = 'animate-pulse shadow-[0_0_20px_rgba(255,230,0,0.85)] border-4 border-[#F97316]'
    }
  } else {
    bossGlowClasses = `border-4 border-black ${isTwitter ? 'hover:border-[#06B6D4]' : isReddit ? 'hover:border-[#FF5722]' : ''}`
  }

  const handleClaimClick = () => {
    sfx.playCoinDrop()
    onClaim(lead, monster.xpReward)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white flex flex-col justify-between group relative overflow-hidden shadow-[8px_8px_0_0_#000] ${bossGlowClasses} transition-all duration-300`}
    >
      {/* Boss Header Section */}
      <div className={`${headerBg} text-white p-4 flex flex-col gap-2 border-b-4 border-black relative`}>
        {/* CRT Scanline Effect for High Bosses */}
        {isBossAura && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-0 opacity-40" />
        )}

        <div className="flex items-start justify-between gap-2 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 border border-white/40 flex items-center gap-1.5 ${badgeBg}`}>
                {isTwitter && <XTwitterIcon className="w-3.5 h-3.5" />}
                {isReddit && <RedditIcon className="w-3.5 h-3.5" />}
                {isTwitter ? 'TWITTER (X)' : isReddit ? 'REDDIT' : lead.platform}
              </span>
            </div>
            <div className="text-lg font-black uppercase truncate max-w-[200px] flex items-center gap-1 tracking-wide">
              {authorDisplay}
              {isTwitter && <CheckCircle2 className="w-4 h-4 text-[#06B6D4] fill-[#06B6D4] text-black inline shrink-0 stroke-[3px]" />}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* 🐉 Boss Tier Header Badge */}
            <div className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] ${monster.badgeBg}`}>
              <span>{monster.icon}</span>
              <span>T{monster.tier} {monster.name.toUpperCase()}</span>
            </div>

            {/* Intent Badge */}
            <div className="bg-[#EF4444] border-2 border-white px-2 py-0.5 text-center shadow-[2px_2px_0_0_#fff] rotate-2 shrink-0">
              <span className="text-[10px] uppercase font-black text-white">Intent {intentScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bounty Content Body */}
      <div className={`p-6 flex-1 ${isTwitter ? 'bg-[#F0F9FF] border-l-8 border-[#06B6D4]' : isReddit ? 'bg-[#FFF7ED] border-l-8 border-[#FF5722]' : 'bg-[#F4F0EA]'}`}>
        <p className="font-bold text-lg leading-relaxed relative z-10 text-gray-900">&quot;{lead.content}&quot;</p>

        {/* Social Signals / Micro Metrics */}
        <div className="mt-4 text-xs font-mono font-bold text-gray-600 flex items-center gap-2 flex-wrap">
          {isTwitter && (
            <>
              <span className="bg-white border border-black/20 px-2 py-0.5">💬 18 replies</span>
              <span className="bg-white border border-black/20 px-2 py-0.5">🔁 6 retweets</span>
              <span className="bg-white border border-black/20 px-2 py-0.5">🖤 42 likes</span>
            </>
          )}
          {isReddit && (
            <>
              <span className="bg-white border border-black/20 px-2 py-0.5">⬆️ 34 upvotes</span>
              <span className="bg-white border border-black/20 px-2 py-0.5">💬 22 comments</span>
              <span className="bg-white border border-black/20 px-2 py-0.5">🏆 2 awards</span>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`border-2 border-black px-2.5 py-1 text-xs font-black uppercase ${isTwitter ? 'bg-[#06B6D4] text-black' : isReddit ? 'bg-[#FFE600] text-black' : 'bg-white'}`}>
            MATCH: {lead.matched}
          </span>
          <span className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase">
            {ageLabel(lead.sourceCreatedAt)}
          </span>
          <span className="bg-[#111] text-[#FFE600] border-2 border-black px-2 py-1 text-[11px] font-mono font-black uppercase">
            REWARD: +{monster.xpReward.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t-4 border-black bg-white space-y-3">
        <div className="flex gap-3">
          {/* High-Dopamine Claim Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClaimClick}
            disabled={isPending}
            className="flex-1 bg-[#A3E635] hover:bg-lime-400 border-4 border-black py-3 font-black uppercase text-sm md:text-base shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 flex items-center justify-center gap-2 cursor-pointer text-black"
          >
            <Swords className="w-5 h-5" />
            <span>⚔️ CLAIM BOUNTY (+{monster.xpReward.toLocaleString()} XP)</span>
          </motion.button>

          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            title={isTwitter ? "Open Tweet on X" : isReddit ? "Open Post on Reddit" : "Open Source"}
            className={`w-14 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1 ${isTwitter ? 'bg-[#06B6D4] hover:bg-cyan-400 text-black' : isReddit ? 'bg-[#FF5722] hover:bg-orange-500 text-white' : 'bg-[#06B6D4] hover:bg-cyan-400'}`}
          >
            {isTwitter ? <XTwitterIcon className="w-6 h-6" /> : isReddit ? <RedditIcon className="w-6 h-6" /> : <ExternalLink className="w-6 h-6 stroke-[3px]" />}
          </a>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenerateAIReply(lead)}
            disabled={isPending || user.level < 5}
            className={`flex-1 border-4 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-2 ${user.level >= 5 ? 'bg-[#A855F7] text-white hover:bg-purple-500 shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1' : 'bg-gray-200 text-gray-500 shadow-none'}`}
          >
            {user.level >= 5 ? <Wand2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />} AI Reply {user.level < 5 && '(Lvl 5)'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onExportToCRM(lead)}
            disabled={isPending || user.level < 10}
            className={`flex-1 border-4 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-2 ${user.level >= 10 ? 'bg-black text-white hover:bg-zinc-800 shadow-[4px_4px_0_0_#A3E635] active:shadow-none active:translate-y-1 active:translate-x-1' : 'bg-gray-200 text-gray-500 shadow-none'}`}
          >
            {user.level >= 10 ? <Database className="w-4 h-4" /> : <Lock className="w-4 h-4" />} CRM Export {user.level < 10 && '(Lvl 10)'}
          </motion.button>
        </div>
      </div>

      {/* Dismiss / Trash Button */}
      <button
        onClick={() => onDismiss(lead.id)}
        disabled={isPending}
        title="Dismiss Bounty"
        className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600 shadow-[2px_2px_0_0_#000] z-20 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.article>
  )
}
