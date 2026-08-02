export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'alltime'

export type GuildHunter = {
  id: string
  rank: number
  name: string
  alias: string
  classTitle: string
  bountiesSlayed: number
  manaEfficiency: number
  activeStreak: number
  isOwner?: boolean
  avatarBadge?: string
  unlockedAchievements?: string[]
  totalLeads?: number
  avgLatency?: string
  pipelineValue?: string
  level?: number
  xp?: number
  xpMax?: number
  activeScouts?: string[]
}

export type Achievement = {
  id: string
  tier: string
  badge: string
  title: string
  description: string
  unlocked: boolean
  progress: number
  target: number
}

export type ChannelBreakdown = {
  name: string
  percent: number
  color: string
}

export type GuildStats = {
  monstersDefeated: number
  spellsCast: number
  questsExported: number
  deadliestWeapon: {
    phrase: string
    count: number
    artifactName?: string
    platform?: string
  }
  heatmapDetails?: Record<string, { count: number; autoReplies: number }>
  heatmap?: Record<string, number>
  conversionRate: number
  criticalHitRate: number
  topChannel: string
  channels?: ChannelBreakdown[]
  scoutSpeed: string
  manaEfficiency?: number
  manaPerReply?: number
  huntingStreak?: number
  level?: number
  xp?: number
  xpRequired?: number
  nextMonsterTarget?: number
  totalKeywords?: number
  leaderboard?: GuildHunter[]
  achievements?: Achievement[]
}
