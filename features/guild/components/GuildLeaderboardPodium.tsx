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
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-black p-4 border-4 border-black shadow-[6px_6px_0_0_#000]">
        
        {/* Season Timeframe Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id
            return (
              <button
                key={tf.id}
                onClick={() => handleTimeframeChange(tf.id)}
                className={`px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-150 border-2 border-black flex flex-col items-center justify-center text-center ${
                  isActive
                    ? 'bg-[#FFE600] text-black shadow-[3px_3px_0_0_#FFF] translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-[#1E293B] text-gray-300 hover:bg-[#334155] hover:text-white'
                }`}
              >
                <span className="font-extrabold">{tf.label}</span>
              </button>
            )
          })}
        </div>

        {/* Anonymous Mode Switcher */}
        <button
          onClick={handleToggleAnonymous}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-black flex items-center justify-center gap-2 shadow-[3px_3px_0_0_#000] transition-all ${
            isAnonymousMode
              ? 'bg-[#FF5722] text-white shadow-[3px_3px_0_0_#FFE600]'
              : 'bg-[#A3E635] text-black shadow-[3px_3px_0_0_#000]'
          }`}
        >
          {isAnonymousMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          <span>{isAnonymousMode ? '[🔒 ANONYMOUS MODE: ON]' : '[🔓 PUBLIC IDENTITY: ON]'}</span>
        </button>
      </div>

      {/* Evidence-status banner */}
      <div className="bg-[#FFE600] border-4 border-black p-3 text-center shadow-[4px_4px_0_0_#000] flex items-center justify-center gap-3">
        <span className="text-sm font-black uppercase tracking-wider text-black">
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
            className={`border-4 border-black bg-white p-6 relative shadow-[6px_6px_0_0_#000] flex flex-col items-center text-center cursor-pointer transition-all ${
              rank2.isOwner ? 'border-[#06B6D4] ring-4 ring-[#06B6D4]/40 shadow-[0_0_20px_#06B6D4]' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute -top-5 bg-[#E2E8F0] border-4 border-black text-black px-4 py-1 font-black text-sm uppercase shadow-[3px_3px_0_0_#000] flex items-center gap-1">
              <span>🥈 RANK #2</span>
            </div>

            {rank2.isOwner && (
              <div className="bg-[#06B6D4] text-black border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 mb-2 mt-2">
                YOU • RANK #2
              </div>
            )}

            {/* Cyan Shield Aura Icon */}
            <div className="w-16 h-16 bg-[#06B6D4] border-4 border-black rounded-full flex items-center justify-center my-3 shadow-[3px_3px_0_0_#000] relative">
              <Shield className="w-9 h-9 text-white fill-white" />
              <div className="absolute -bottom-1 -right-1 bg-black text-[#06B6D4] text-[10px] px-1 font-black border border-white">
                SILVER
              </div>
            </div>

            {/* Alias / Real Name */}
            <h3 className="text-xl font-black uppercase tracking-tight text-black truncate max-w-full">
              {displayName(rank2)}
            </h3>

            {/* Title */}
            <span className="bg-black text-[#06B6D4] text-xs font-black uppercase px-3 py-1 border border-black my-2">
              {rank2.classTitle || '[🛡️ KNIGHT]'}
            </span>

            {/* Bounties & Streak */}
            <div className="w-full bg-[#F4F0EA] border-2 border-black p-3 my-2 space-y-1">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-gray-600">BOUNTIES</span>
                <span className="text-[#FF5722] text-base">{rank2.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-gray-500">STREAK</span>
                <span className="text-black flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#FF5722] fill-[#FF5722]" /> {rank2.activeStreak} Days
                </span>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase bg-[#06B6D4]/20 border border-black px-2 py-1 text-black">
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
            className={`border-4 border-black bg-[#FFE600] p-6 md:p-8 relative shadow-[8px_8px_0_0_#000] flex flex-col items-center text-center -translate-y-4 cursor-pointer transition-all ${
              rank1.isOwner ? 'ring-4 ring-[#FF5722] shadow-[0_0_25px_#FFE600]' : ''
            }`}
          >
            {/* Floating Pixel Crown Badge */}
            <div className="absolute -top-7 bg-black text-[#FFE600] border-4 border-black px-5 py-1.5 font-black text-base uppercase shadow-[4px_4px_0_0_#FFF] flex items-center gap-2 animate-bounce">
              <Crown className="w-5 h-5 text-[#FFE600] fill-[#FFE600]" />
              <span>🥇 RANK #1 CHAMPION</span>
            </div>

            {rank1.isOwner && (
              <div className="bg-[#FF5722] text-white border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 mb-2 mt-4 shadow-[2px_2px_0_0_#000]">
                YOU • RANK #1
              </div>
            )}

            {/* Dynamic Fire Glow Icon */}
            <div className="w-20 h-20 bg-[#FF5722] border-4 border-black rounded-full flex items-center justify-center my-4 shadow-[4px_4px_0_0_#000] relative">
              <Crown className="w-11 h-11 text-[#FFE600] fill-[#FFE600]" />
              <Flame className="w-6 h-6 text-[#FFE600] absolute -top-1 -right-1 animate-pulse" />
            </div>

            {/* Alias / Real Name */}
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black truncate max-w-full">
              {displayName(rank1)}
            </h3>

            {/* Champion Title */}
            <span className="bg-black text-[#FFE600] text-sm font-black uppercase px-4 py-1 border-2 border-black my-2 shadow-[2px_2px_0_0_#FFF]">
              {rank1.classTitle || '[👑 DRAGON SLAYER]'}
            </span>

            {/* Stats */}
            <div className="w-full bg-white border-4 border-black p-4 my-3 space-y-2 shadow-[3px_3px_0_0_#000]">
              <div className="flex justify-between items-center text-sm font-black">
                <span className="text-gray-700">BOUNTIES SLAYED</span>
                <span className="text-3xl font-black text-[#FF5722]">{rank1.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black pt-2 border-t-2 border-black/10">
                <span className="text-gray-600">MANA EFFICIENCY</span>
                <span className="text-black bg-[#A3E635] px-2 py-0.5 border border-black">
                  {rank1.manaEfficiency}%
                </span>
              </div>
            </div>

            <div className="text-xs font-black uppercase bg-black text-[#FFE600] px-3 py-1 border border-black shadow-[2px_2px_0_0_#FFF]">
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
            className={`border-4 border-black bg-white p-6 relative shadow-[6px_6px_0_0_#000] flex flex-col items-center text-center cursor-pointer transition-all ${
              rank3.isOwner ? 'border-[#A855F7] ring-4 ring-[#A855F7]/40 shadow-[0_0_20px_#A855F7]' : ''
            }`}
          >
            {/* Rank Badge */}
            <div className="absolute -top-5 bg-[#D97706] border-4 border-black text-black px-4 py-1 font-black text-sm uppercase shadow-[3px_3px_0_0_#000] flex items-center gap-1">
              <span>🥉 RANK #3</span>
            </div>

            {rank3.isOwner && (
              <div className="bg-[#A855F7] text-black border-2 border-black text-[10px] font-black uppercase px-2 py-0.5 mb-2 mt-2">
                YOU • RANK #3
              </div>
            )}

            {/* Purple Crystal Aura Icon */}
            <div className="w-16 h-16 bg-[#A855F7] border-4 border-black rounded-full flex items-center justify-center my-3 shadow-[3px_3px_0_0_#000] relative">
              <Zap className="w-9 h-9 text-[#FFE600] fill-[#FFE600]" />
              <div className="absolute -bottom-1 -right-1 bg-black text-[#A855F7] text-[10px] px-1 font-black border border-white">
                BRONZE
              </div>
            </div>

            {/* Alias / Real Name */}
            <h3 className="text-xl font-black uppercase tracking-tight text-black truncate max-w-full">
              {displayName(rank3)}
            </h3>

            {/* Title */}
            <span className="bg-black text-[#A855F7] text-xs font-black uppercase px-3 py-1 border border-black my-2">
              {rank3.classTitle || '[🔮 ARCHMAGE]'}
            </span>

            {/* Bounties & Efficiency */}
            <div className="w-full bg-[#F4F0EA] border-2 border-black p-3 my-2 space-y-1">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-gray-600">BOUNTIES</span>
                <span className="text-[#FF5722] text-base">{rank3.bountiesSlayed}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-gray-500">EFFICIENCY</span>
                <span className="text-black bg-[#A855F7] text-white px-2 py-0.5 border border-black">
                  {rank3.manaEfficiency}%
                </span>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase bg-[#A855F7]/20 border border-black px-2 py-1 text-black">
              🔮 High Mana Efficiency Aura
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
