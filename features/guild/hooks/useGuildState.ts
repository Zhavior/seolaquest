import { useState } from 'react'
import { Achievement, ChannelBreakdown, GuildHunter, GuildStats, Timeframe } from '@/features/guild/types'
import { sfx } from '@/lib/sfx'

export function useGuildState({ stats }: { stats: GuildStats }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [isAnonymousMode, setIsAnonymousMode] = useState(true)
  const [selectedHunter, setSelectedHunter] = useState<GuildHunter | null>(null)

  const handleSelectHunter = (hunter: GuildHunter) => {
    sfx.playHoverBlip()
    setSelectedHunter(hunter)
  }

  // The service returns only measured and consented rows. Timeframe changes must
  // never synthesize rankings by multiplying current totals.
  const leaderboard = stats.leaderboard ?? []
  const topThree = leaderboard.filter((hunter) => hunter.rank <= 3)
  const tableHunters = leaderboard.filter((hunter) => hunter.rank > 3)

  const thirtyDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (29 - index))
    return date.toISOString().slice(0, 10)
  })

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00.000Z`)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }

  const getDayMetrics = (dateString: string) => {
    if (stats.heatmapDetails?.[dateString]) return stats.heatmapDetails[dateString]
    return { count: stats.heatmap?.[dateString] ?? 0, autoReplies: 0 }
  }

  const userLevel = stats.level ?? 1
  const nextTarget = stats.nextMonsterTarget ?? 50
  const monsterProgressPct = nextTarget > 0
    ? Math.min(100, Math.round((stats.monstersDefeated / nextTarget) * 100))
    : 0
  const manaEfficiency = stats.manaEfficiency ?? 0
  const manaPerReply = stats.manaPerReply ?? 0
  const huntingStreak = stats.huntingStreak ?? 0
  const channels: ChannelBreakdown[] = stats.channels ?? []
  const achievementsList: Achievement[] = stats.achievements ?? []
  const deadliestArtifact = stats.deadliestWeapon?.artifactName
    ?? (stats.deadliestWeapon?.phrase && stats.deadliestWeapon.phrase !== 'None yet'
      ? stats.deadliestWeapon.phrase
      : 'No contacted-keyword data yet')

  return {
    hoveredDate,
    setHoveredDate,
    timeframe,
    setTimeframe,
    isAnonymousMode,
    setIsAnonymousMode,
    selectedHunter,
    setSelectedHunter,
    handleSelectHunter,
    topThree,
    tableHunters,
    thirtyDays,
    formatDate,
    getDayMetrics,
    userLevel,
    nextTarget,
    monsterProgressPct,
    manaEfficiency,
    manaPerReply,
    huntingStreak,
    channels,
    achievementsList,
    deadliestArtifact,
    deadliestWeaponCount: stats.deadliestWeapon?.count ?? 0,
  }
}
