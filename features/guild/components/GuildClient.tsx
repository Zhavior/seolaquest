'use client'

import { motion, Variants } from 'framer-motion'
import { Swords, Shield, Sparkles } from 'lucide-react'
import GuildLeaderboardPodium from '@/features/guild/components/GuildLeaderboardPodium'
import GuildLedgerTable from '@/features/guild/components/GuildLedgerTable'
import HunterStatModal from '@/features/guild/components/HunterStatModal'

import { useGuildState } from '@/features/guild/hooks/useGuildState'
import { GuildMonsterCard } from '@/features/guild/components/GuildMonsterCard'
import { GuildSecondaryStats } from '@/features/guild/components/GuildSecondaryStats'
import { GuildArmoryCard } from '@/features/guild/components/GuildArmoryCard'
import { GuildActivityCard } from '@/features/guild/components/GuildActivityCard'
import { GuildAchievementsCard } from '@/features/guild/components/GuildAchievementsCard'
import { GuildStats } from '@/features/guild/types'

export default function GuildClient({ stats }: { stats: GuildStats }) {
  const state = useGuildState({ stats })

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#FDFBF7] relative select-none">
      {/* Authentic Parchment / Commander's Map Paper Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      <div className="min-h-[100dvh] w-full max-w-[1400px] mx-auto p-4 md:p-8 font-black relative z-10">
        
        {/* Subtle Background Swords Emblem */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 opacity-[0.06] pointer-events-none">
          <Swords className="w-[650px] h-[650px] text-black" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 relative z-10"
        >
          {/* Neo-Brutalist Ticker Banner */}
          <motion.div variants={item} className="w-full overflow-hidden border-4 border-black bg-[#FFE600] py-2 flex whitespace-nowrap shadow-[4px_4px_0_0_#000]">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex gap-10 text-lg md:text-xl uppercase tracking-widest font-black"
            >
              {[...Array(10)].map((_, i) => (
                <span key={i} className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-black" /> ⚔️ TENANT ACTIVITY LEDGER <Sparkles className="w-5 h-5 text-black" /> 🛡️ MEASURED ROWS ONLY
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Header */}
          <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-8 h-8 text-[#FF5722]" />
                <span className="bg-black text-[#FFE600] uppercase text-xs font-black tracking-widest px-3 py-1 border-2 border-black -rotate-1">
                  COMMANDER&apos;S MAP & ANALYTICS
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
                Guild Hall
              </h1>
              <p className="text-xl md:text-2xl mt-2 uppercase bg-black text-white inline-block px-4 py-1 -rotate-1 border-2 border-black">
                Tenant Activity & Outcome Ledger
              </p>
            </div>
            
            <div className="flex items-center gap-3 border-4 border-black bg-white px-5 py-3 shadow-[6px_6px_0_0_#000]">
              <span className="relative flex h-4 w-4">
                <span className="relative inline-flex rounded-full h-4 w-4 bg-zinc-400 border-2 border-black"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold">Provider Status</span>
                <span className="text-lg uppercase font-black leading-none text-black">Not shown here</span>
              </div>
            </div>
          </motion.div>

          {/* 🏛️ 1. Guild Leaderboard Podium (Top 3 Arcade Podium & Timeframe Selector) */}
          {state.topThree.length === 0 && state.tableHunters.length === 0 ? (
            <motion.div variants={item} className="mt-8 border-4 border-black bg-white p-8 shadow-[6px_6px_0_0_#000]">
              <h2 className="text-2xl font-black uppercase">Guild rankings unavailable</h2>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-zinc-600">
                CoQuest does not publish cross-account rankings until a consented public-profile model exists. Your private,
                tenant-scoped activity remains visible below.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div variants={item} className="mt-8">
                <GuildLeaderboardPodium
                  timeframe={state.timeframe}
                  setTimeframe={state.setTimeframe}
                  isAnonymousMode={state.isAnonymousMode}
                  setIsAnonymousMode={state.setIsAnonymousMode}
                  topThree={state.topThree}
                  onSelectHunter={state.handleSelectHunter}
                />
              </motion.div>
              <motion.div variants={item} className="mt-8">
                <GuildLedgerTable
                  hunters={state.tableHunters}
                  isAnonymousMode={state.isAnonymousMode}
                  onSelectHunter={state.handleSelectHunter}
                />
              </motion.div>
            </>
          )}

          {/* ⚔️ 1. Elevate the RPG Analytics Metaphor (Stat Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-8">
            <GuildMonsterCard
              item={item}
              userLevel={state.userLevel}
              nextTarget={state.nextTarget}
              monstersDefeated={stats.monstersDefeated}
              monsterProgressPct={state.monsterProgressPct}
            />

            <GuildSecondaryStats
              item={item}
              spellsCast={stats.spellsCast}
              manaEfficiency={state.manaEfficiency}
              manaPerReply={state.manaPerReply}
              questsExported={stats.questsExported}
            />

            {/* 📊 2. Make "The Armory" Interactive & Deep (Weapon Proficiency Matrix) */}
            <GuildArmoryCard
              item={item}
              deadliestArtifact={state.deadliestArtifact}
              deadliestWeaponCount={state.deadliestWeaponCount}
              channels={state.channels}
              criticalHitRate={stats.criticalHitRate}
              scoutSpeed={stats.scoutSpeed}
            />

            {/* 🔥 3. Turn the "Activity Heatmap" into a "Hunting Streak" */}
            <GuildActivityCard
              item={item}
              huntingStreak={state.huntingStreak}
              thirtyDays={state.thirtyDays}
              getDayMetrics={state.getDayMetrics}
              formatDate={state.formatDate}
            />
          </div>

          {/* 🏆 4. Add "Guild Achievements" (Unlockable Badges) */}
          <GuildAchievementsCard
            item={item}
            achievementsList={state.achievementsList}
          />
        </motion.div>
      </div>

      <HunterStatModal
        hunter={state.selectedHunter}
        isAnonymousMode={state.isAnonymousMode}
        onClose={() => state.setSelectedHunter(null)}
      />
    </div>
  )
}
