'use client'

import { motion } from 'framer-motion'
import { Crown, Shield, Flame, Zap, Lock, Unlock } from 'lucide-react'
import { sfx } from '@/lib/sfx'
import { Timeframe, GuildHunter } from '@/features/guild/types'

interface GuildLeaderboardPodiumProps {
  timeframe: Timeframe
  setTimeframe: (tf: Timeframe) => void
  isAnonymousMode: boolean
  setIsAnonymousMode: (val: boolean) => void
  topThree: GuildHunter[]
  onSelectHunter?: (hunter: GuildHunter) => void
}

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: 'daily', label: '⚡ 24-HOUR DAILY' },
  { id: 'weekly', label: '⚔️ TOP WEEKLY' },
  { id: 'monthly', label: '🏆 TOP MONTHLY' },
  { id: 'alltime', label: '👑 ALL-TIME' },
]

export default function GuildLeaderboardPodium({
  timeframe,
  setTimeframe,
  isAnonymousMode,
  setIsAnonymousMode,
  topThree,
  onSelectHunter,
}: GuildLeaderboardPodiumProps) {
  const rank1 = topThree.find((h) => h.rank === 1) || topThree[0]
  const rank2 = topThree.find((h) => h.rank === 2) || topThree[1]
  const rank3 = topThree.find((h) => h.rank === 3) || topThree[2]

  const handleTimeframeChange = (tf: Timeframe) => {
    sfx.playCoinDrop()
    setTimeframe(tf)
  }

  const handleToggleAnonymous = () => {
    sfx.playSwordSlash()
    setIsAnonymousMode(!isAnonymousMode)
  }

  const displayName = (hunter?: GuildHunter) => {
    if (!hunter) return 'Anonymous hunter'
    if (hunter.isOwner && !isAnonymousMode) {
      return hunter.name || 'Unnamed hunter'
    }
    return hunter.alias || 'Anonymous hunter'
  }

  return (
    <div className="w-full space-y-6">
      {/* Timeframe Matrix Bar & Privacy Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-black p-4 rounded-[20px] border border-outline shadow-sm">
        
        {/* Season Timeframe Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id
            return (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                className={`px-3 py-2.5 text-xs font-semibold normal-case tracking-wider transition-all duration-150 rounded-lg border border-outline flex flex-col items-center justify-center text-center ${
                  isActive
                    ? 'bg-accent text-on-accent shadow-sm translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-inset text-ink-muted hover:bg-forest hover:text-white'
                }`}
              >
                <span className="font-semibold">{tf.label}</span>
              </button>
            )
          })}
        </div>

        {/* Anonymous Mode Switcher */}
        <button
          onClick={handleToggleAnonymous}
          className={`px-4 py-2.5 text-xs font-semibold normal-case tracking-wider rounded-lg border border-outline flex items-center justify-center gap-2 shadow-none transition-all ${
            isAnonymousMode
              ? 'bg-accent-2 text-on-accent shadow-sm'
              : 'bg-success text-on-accent shadow-none'
          }`}
        >
          {isAnonymousMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          <span>{isAnonymousMode ? '[🔒 ANONYMOUS MODE: ON]' : '[🔓 PUBLIC IDENTITY: ON]'}</span>
        </button>
      </div>

      {/* Evidence-status banner */}
      <div className="bg-accent rounded-[20px] border border-outline p-3 text-center shadow-sm flex items-center justify-center gap-3">
        <span className="text-sm font-semibold normal-case tracking-wider text-on-accent">
          Rankings remain unavailable until participants explicitly opt in to public profiles.
        </span>
      </div>

      {/* 🏆 Arcade Hall of Champions Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">

        {/* 🥈 RANK 2 (Silver Frame - Left) */}
        {rank2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6 }}
            onMouseEnter={() => sfx.playHoverBlip()}
            role="button"
            tabIndex={0}
            aria-label={`View ${displayName(rank2)} details`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                sfx.playHoverBlip()
                onSelectHunter?.(rank2)
              }
            }}
            onClick={() => {
              sfx.playHoverBlip()
              onSelectHunter?.(rank2)
            }}
            className={`rounded-[20px] border border-outline bg-card p-6 relative shadow-sm flex flex-col items-center text-center cursor-pointer transition-all ${
              rank2.isOwner ? 'border-accent ring-4 ring-accent/40 shadow-sm' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute -top-5 bg-inset rounded-[20px] border border-outline text-ink px-4 py-1 font-semibold text-sm normal-case shadow-none flex items-center gap-1">
              <span>🥈 RANK #2</span>
            </div>

            {rank2.isOwner && (
              <div className="bg-info text-on-accent rounded-lg border border-outline text-[10px] font-semibold normal-case px-2 py-0.5 mb-2 mt-2">
                YOU • RANK #2
              </div>
            )}

            {/* Cyan Shield Aura Icon */}
            <div className="w-16 h-16 bg-info rounded-[20px] border border-outline rounded-full flex items-center justify-center my-3 shadow-none relative">
              <Shield className="w-9 h-9 text-white fill-white" />
              <div className="absolute -bottom-1 -right-1 bg-forest text-on-forest text-[10px] px-1 font-semibold border border-white">
                SILVER
              </div>
            </div>

            {/* Alias / Real Name */}
            <h3 className="font-display text-xl font-semibold normal-case tracking-tight text-ink truncate max-w-full">
              {displayName(rank2)}
            </h3>

            {/* Title */}
            <span className="bg-forest text-on-forest text-xs font-semibold normal-case px-3 py-1 border border-outline my-2">
              {rank2.classTitle || '[🛡️ KNIGHT]'}
            </span>

            {/* Bounties & Streak */}
            <div className="w-full bg-canvas rounded-lg border border-outline p-3 my-2 space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-muted">BOUNTIES</span>
                <span className="text-ink text-base">{rank2.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-medium">
                <span className="text-ink-muted">STREAK</span>
                <span className="text-ink flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-accent fill-[#FF5722]" /> {rank2.activeStreak} Days
                </span>
              </div>
            </div>

            <div className="text-[10px] font-semibold normal-case bg-info/20 border border-outline px-2 py-1 text-ink">
              Stored tenant activity
            </div>
          </motion.div>
        )}

        {/* 🥇 RANK 1 (Gold Frame - Center & Elevated) */}
        {rank1 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -8 }}
            onMouseEnter={() => sfx.playHoverBlip()}
            role="button"
            tabIndex={0}
            aria-label={`View ${displayName(rank1)} details`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                sfx.playHoverBlip()
                onSelectHunter?.(rank1)
              }
            }}
            onClick={() => {
              sfx.playHoverBlip()
              onSelectHunter?.(rank1)
            }}
            className={`rounded-[20px] border border-outline bg-accent p-6 md:p-8 relative shadow-sm flex flex-col items-center text-center -translate-y-4 cursor-pointer transition-all ${
              rank1.isOwner ? 'ring-4 ring-accent shadow-sm' : ''
            }`}
          >
            {/* Floating Pixel Crown Badge */}
            <div className="absolute -top-7 bg-black text-accent rounded-[20px] border border-outline px-5 py-1.5 font-semibold text-base normal-case shadow-sm flex items-center gap-2 ">
              <Crown className="w-5 h-5 text-accent fill-accent" />
              <span>🥇 RANK #1 CHAMPION</span>
            </div>

            {rank1.isOwner && (
              <div className="bg-accent-2 text-on-accent rounded-lg border border-outline text-[10px] font-semibold normal-case px-2 py-0.5 mb-2 mt-4 shadow-none">
                YOU • RANK #1
              </div>
            )}

            {/* Dynamic Fire Glow Icon */}
            <div className="w-20 h-20 bg-accent-2 rounded-[20px] border border-outline rounded-full flex items-center justify-center my-4 shadow-sm relative">
              <Crown className="w-11 h-11 text-accent fill-accent" />
              <Flame className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>

            {/* Alias / Real Name */}
            <h3 className="font-display text-2xl md:text-3xl font-semibold normal-case tracking-tight text-ink truncate max-w-full">
              {displayName(rank1)}
            </h3>

            {/* Champion Title */}
            <span className="bg-black text-accent text-sm font-semibold normal-case px-4 py-1 rounded-lg border border-outline my-2 shadow-sm">
              {rank1.classTitle || '[👑 DRAGON SLAYER]'}
            </span>

            {/* Stats */}
            <div className="w-full bg-card rounded-[20px] border border-outline p-4 my-3 space-y-2 shadow-none">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-ink-muted">BOUNTIES SLAYED</span>
                <span className="text-3xl font-semibold text-accent">{rank1.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t border-outline/10">
                <span className="text-ink-muted">MANA EFFICIENCY</span>
                <span className="text-on-accent bg-success px-2 py-0.5 border border-outline">
                  {rank1.manaEfficiency}%
                </span>
              </div>
            </div>

            <div className="text-xs font-semibold normal-case bg-black text-accent px-3 py-1 border border-outline shadow-sm">
              Stored rank position
            </div>
          </motion.div>
        )}

        {/* 🥉 RANK 3 (Bronze Frame - Right) */}
        {rank3 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -6 }}
            onMouseEnter={() => sfx.playHoverBlip()}
            role="button"
            tabIndex={0}
            aria-label={`View ${displayName(rank3)} details`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                sfx.playHoverBlip()
                onSelectHunter?.(rank3)
              }
            }}
            onClick={() => {
              sfx.playHoverBlip()
              onSelectHunter?.(rank3)
            }}
            className={`rounded-[20px] border border-outline bg-card p-6 relative shadow-sm flex flex-col items-center text-center cursor-pointer transition-all ${
              rank3.isOwner ? 'border-accent ring-4 ring-accent/40 shadow-sm' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute -top-5 bg-highlight rounded-[20px] border border-outline text-on-accent px-4 py-1 font-semibold text-sm normal-case shadow-none flex items-center gap-1">
              <span>🥉 RANK #3</span>
            </div>

            {rank3.isOwner && (
              <div className="bg-forest text-on-forest rounded-lg border border-outline text-[10px] font-semibold normal-case px-2 py-0.5 mb-2 mt-2">
                YOU • RANK #3
              </div>
            )}

            {/* Purple Crystal Aura Icon */}
            <div className="w-16 h-16 bg-forest rounded-[20px] border border-outline rounded-full flex items-center justify-center my-3 shadow-none relative">
              <Zap className="w-9 h-9 text-accent fill-accent" />
              <div className="absolute -bottom-1 -right-1 bg-black text-accent text-[10px] px-1 font-semibold border border-white">
                BRONZE
              </div>
            </div>

            {/* Alias / Real Name */}
            <h3 className="font-display text-xl font-semibold normal-case tracking-tight text-ink truncate max-w-full">
              {displayName(rank3)}
            </h3>

            {/* Title */}
            <span className="bg-black text-accent text-xs font-semibold normal-case px-3 py-1 border border-outline my-2">
              {rank3.classTitle || '[🔮 ARCHMAGE]'}
            </span>

            {/* Bounties & Efficiency */}
            <div className="w-full bg-canvas rounded-lg border border-outline p-3 my-2 space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink-muted">BOUNTIES</span>
                <span className="text-ink text-base">{rank3.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-medium">
                <span className="text-ink-muted">EFFICIENCY</span>
                <span className="text-on-forest bg-forest text-white px-2 py-0.5 border border-outline">
                  {rank3.manaEfficiency}%
                </span>
              </div>
            </div>

            <div className="text-[10px] font-semibold normal-case bg-inset border border-outline px-2 py-1 text-ink">
              🔮 High Mana Efficiency Aura
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
