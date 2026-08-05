'use client'

import { motion, Variants } from 'framer-motion'
import { Swords, Shield, Sparkles } from 'lucide-react'
import {
  QuestPageHeader,
  QuestPageShell,
  QuestPanel,
  QuestStatusPill,
  QuestTicker,
} from '@/components/quest'
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
    <>
      <QuestPageShell watermark={<Swords className="h-[650px] w-[650px] text-ink" />} gap="none">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 relative z-10"
        >
          {/* Neo-Brutalist Ticker Banner */}
          <motion.div variants={item}>
            <QuestTicker label="Tenant activity ledger. Measured rows only.">
              <Sparkles className="h-5 w-5 text-ink" /> ⚔️ TENANT ACTIVITY LEDGER{' '}
              <Sparkles className="h-5 w-5 text-ink" /> 🛡️ MEASURED ROWS ONLY
            </QuestTicker>
          </motion.div>

          {/* Header */}
          <motion.div variants={item}>
            <QuestPageHeader
              className="mt-6"
              icon={<Shield className="h-8 w-8" />}
              eyebrow={<>COMMANDER&apos;S MAP &amp; ANALYTICS</>}
              title="Guild Hall"
              subtitle="Tenant Activity & Outcome Ledger"
              status={<QuestStatusPill state="idle" label="Provider status" value="Not shown here" />}
            />
          </motion.div>

          {/* 🏛️ 1. Guild Leaderboard Podium (Top 3 Arcade Podium & Timeframe Selector) */}
          {state.topThree.length === 0 && state.tableHunters.length === 0 ? (
            <motion.div variants={item}>
              <QuestPanel padding="lg" className="mt-8" aria-labelledby="guild-rankings-heading">
                <h2 id="guild-rankings-heading" className="text-2xl font-black uppercase">
                  Guild rankings unavailable
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-ink-muted">
                  CoQuest does not publish cross-account rankings until a consented public-profile model exists. Your private,
                  tenant-scoped activity remains visible below.
                </p>
              </QuestPanel>
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
      </QuestPageShell>

      <HunterStatModal
        hunter={state.selectedHunter}
        isAnonymousMode={state.isAnonymousMode}
        onClose={() => state.setSelectedHunter(null)}
      />
    </>
  )
}
