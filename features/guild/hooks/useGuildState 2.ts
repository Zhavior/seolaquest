import { useState } from 'react'
import { Timeframe, GuildHunter, GuildStats, ChannelBreakdown, Achievement } from '@/features/guild/types'
import { sfx } from '@/lib/sfx'

export function useGuildState({ stats }: { stats: GuildStats }) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly')
  const [isAnonymousMode, setIsAnonymousMode] = useState<boolean>(true)
  const [selectedHunter, setSelectedHunter] = useState<GuildHunter | null>(null)

  const handleSelectHunter = (hunter: GuildHunter) => {
    sfx.playHoverBlip()
    setSelectedHunter(hunter)
  }

  const tfMult = timeframe === 'daily' ? 0.15 : timeframe === 'weekly' ? 1 : timeframe === 'monthly' ? 4 : 12

  const defaultLeaderboard: GuildHunter[] = (stats.leaderboard || [
    {
      id: 'guild_hunter_1',
      rank: 1,
      name: 'Vortex_Grandmaster',
      alias: 'Cryptic_Archmage_99',
      classTitle: '[👑 DRAGON SLAYER]',
      bountiesSlayed: 342,
      manaEfficiency: 96,
      activeStreak: 28,
      isOwner: false,
      avatarBadge: '👑',
    },
    {
      id: 'owner_user_id',
      rank: 2,
      name: 'REINALD SANTOS',
      alias: 'Shadow_Paladin_77',
      classTitle: '[🛡️ KNIGHT]',
      bountiesSlayed: Math.max(stats.monstersDefeated, 285),
      manaEfficiency: stats.manaEfficiency ?? 85,
      activeStreak: stats.huntingStreak ?? 14,
      isOwner: true,
      avatarBadge: '🛡️',
    },
    {
      id: 'guild_hunter_3',
      rank: 3,
      name: 'Ember_Sorcerer',
      alias: 'Vortex_Warlock_12',
      classTitle: '[🔮 ARCHMAGE]',
      bountiesSlayed: 210,
      manaEfficiency: 91,
      activeStreak: 19,
      isOwner: false,
      avatarBadge: '🔮',
    },
    {
      id: 'guild_hunter_4',
      rank: 4,
      name: 'Cyber_Hunter_90',
      alias: 'Neon_Scout_45',
      classTitle: '[⚡ STORM SCOUT]',
      bountiesSlayed: 175,
      manaEfficiency: 88,
      activeStreak: 12,
      isOwner: false,
      avatarBadge: '⚡',
    },
    {
      id: 'guild_hunter_5',
      rank: 5,
      name: 'Iron_Templar_02',
      alias: 'Iron_Templar_02',
      classTitle: '[🛡️ IRON GUARD]',
      bountiesSlayed: 148,
      manaEfficiency: 85,
      activeStreak: 9,
      isOwner: false,
      avatarBadge: '🗡️',
    },
    {
      id: 'guild_hunter_6',
      rank: 6,
      name: 'Frost_Berserker_88',
      alias: 'Frost_Berserker_88',
      classTitle: '[🗡️ NIGHT BLADE]',
      bountiesSlayed: 132,
      manaEfficiency: 83,
      activeStreak: 8,
      isOwner: false,
      avatarBadge: '❄️',
    },
    {
      id: 'guild_hunter_7',
      rank: 7,
      name: 'Pyro_Mage_33',
      alias: 'Pyro_Mage_33',
      classTitle: '[🔥 PYRO MAGE]',
      bountiesSlayed: 115,
      manaEfficiency: 82,
      activeStreak: 6,
      isOwner: false,
      avatarBadge: '🔥',
    },
    {
      id: 'guild_hunter_8',
      rank: 8,
      name: 'Void_Hunter_64',
      alias: 'Void_Hunter_64',
      classTitle: '[🌀 VOID HUNTER]',
      bountiesSlayed: 98,
      manaEfficiency: 80,
      activeStreak: 5,
      isOwner: false,
      avatarBadge: '🌀',
    },
    {
      id: 'guild_hunter_9',
      rank: 9,
      name: 'Apex_Slayer_11',
      alias: 'Apex_Slayer_11',
      classTitle: '[💎 APEX SLAYER]',
      bountiesSlayed: 84,
      manaEfficiency: 79,
      activeStreak: 4,
      isOwner: false,
      avatarBadge: '💎',
    },
    {
      id: 'guild_hunter_10',
      rank: 10,
      name: 'Hawkeye_Scout_05',
      alias: 'Hawkeye_Scout_05',
      classTitle: '[🏹 HAWKEYE]',
      bountiesSlayed: 72,
      manaEfficiency: 77,
      activeStreak: 3,
      isOwner: false,
      avatarBadge: '🏹',
    },
  ]).map((h) => ({
    ...h,
    bountiesSlayed: Math.round(h.bountiesSlayed * tfMult),
  }))

  const topThree = defaultLeaderboard.filter((h) => h.rank <= 3)
  const tableHunters = defaultLeaderboard.filter((h) => h.rank > 3)

  const thirtyDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDayMetrics = (dateStr: string) => {
    if (stats.heatmapDetails && stats.heatmapDetails[dateStr]) {
      return stats.heatmapDetails[dateStr]
    }
    const legacyCount = stats.heatmap ? (stats.heatmap[dateStr] || 0) : 0
    return {
      count: legacyCount,
      autoReplies: Math.floor(legacyCount * 0.4)
    }
  }

  const userLevel = stats.level || 5
  const nextTarget = stats.nextMonsterTarget || 50
  const monsterProgressPct = Math.min(100, Math.round((stats.monstersDefeated / nextTarget) * 100))
  const manaEfficiency = stats.manaEfficiency ?? 85
  const manaPerReply = stats.manaPerReply ?? 0.4
  const huntingStreak = stats.huntingStreak ?? 14

  const channels: ChannelBreakdown[] = stats.channels && stats.channels.length > 0 ? stats.channels : [
    { name: 'r/SaaS (Reddit)', percent: 60, color: '#FF5722' },
    { name: 'X / Twitter', percent: 30, color: '#06B6D4' },
    { name: 'r/webdev', percent: 10, color: '#A3E635' }
  ]

  const achievementsList: Achievement[] = stats.achievements && stats.achievements.length > 0 ? stats.achievements : [
    {
      id: 'first_blood',
      tier: 'bronze',
      badge: '🥉',
      title: 'First Blood',
      description: 'Deploy your first Keyword Scout.',
      unlocked: (stats.totalKeywords ?? 1) > 0 || stats.monstersDefeated > 0,
      progress: 1,
      target: 1,
    },
    {
      id: 'bounty_hunter',
      tier: 'silver',
      badge: '🥈',
      title: 'Bounty Hunter',
      description: 'Defeat 100 Monsters (Process 100 Leads).',
      unlocked: stats.monstersDefeated >= 100,
      progress: Math.min(stats.monstersDefeated, 100),
      target: 100,
    },
    {
      id: 'archmage',
      tier: 'gold',
      badge: '🥇',
      title: 'Archmage',
      description: 'Cast 50 Auto-Replies with >10% Conversion Rate.',
      unlocked: stats.spellsCast >= 50 && stats.conversionRate >= 10,
      progress: Math.min(stats.spellsCast, 50),
      target: 50,
    },
    {
      id: 'dragon_slayer',
      tier: 'diamond',
      badge: '💎',
      title: 'Dragon Slayer',
      description: 'Close a high-ticket enterprise bounty.',
      unlocked: stats.questsExported >= 1,
      progress: Math.min(stats.questsExported, 1),
      target: 1,
    },
  ]

  const deadliestArtifact = stats.deadliestWeapon?.artifactName || 
    (stats.deadliestWeapon?.phrase && stats.deadliestWeapon.phrase !== 'None yet' 
      ? `Excalibur of Reddit: '${stats.deadliestWeapon.phrase}'`
      : `Excalibur of Reddit: 'looking for CRM'`)

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
    deadliestWeaponCount: stats.deadliestWeapon?.count || 142,
  }
}
