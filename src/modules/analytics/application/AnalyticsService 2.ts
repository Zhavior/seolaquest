import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { LeadStatus } from '@prisma/client'

export class AnalyticsService {
  static async getAnalytics() {
    const user = await requireCurrentUser()
    
    // Calculate the last 7 days
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }

    // Fetch claimed leads in the last 7 days
    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        status: { in: [LeadStatus.CONTACTED, LeadStatus.DISMISSED] },
        OR: [
          { contactedAt: { gte: days[0] } },
          { dismissedAt: { gte: days[0] } }
        ]
      },
      select: { status: true, contactedAt: true, dismissedAt: true }
    })

    // Format response
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const analytics = days.map((date) => {
      const dayStart = date.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      
      const dayLeads = leads.filter(l => {
        const t = l.status === LeadStatus.CONTACTED ? l.contactedAt?.getTime() : l.dismissedAt?.getTime()
        if (!t) return false;
        return t >= dayStart && t < dayEnd
      })

      return {
        day: dayNames[date.getDay()],
        claimed: dayLeads.filter(l => l.status === LeadStatus.CONTACTED).length,
        dismissed: dayLeads.filter(l => l.status === LeadStatus.DISMISSED).length,
      }
    })

    return analytics
  }

  static async getLeaderboard() {
    await requireCurrentUser()
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 5,
      select: { name: true, title: true, level: true, xp: true }
    })
    return topUsers
  }

  static async getGuildStats(timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'weekly') {
    const user = await requireCurrentUser()
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    
    const totalKeywords = await prisma.trackedKeyword.count({
      where: { userId: user.id }
    })

    const monstersDefeated = await prisma.lead.count({
      where: { userId: user.id, status: { in: ['CONTACTED', 'DISMISSED'] } }
    })

    const contactedLeads = await prisma.lead.findMany({
      where: { userId: user.id, status: 'CONTACTED' },
      include: { keyword: true }
    })
    
    const keywordCounts: Record<string, { phrase: string, count: number, platform: string }> = {}
    for (const lead of contactedLeads) {
      if (!keywordCounts[lead.keywordId]) {
        keywordCounts[lead.keywordId] = { phrase: lead.keyword.phrase, count: 0, platform: lead.platform }
      }
      keywordCounts[lead.keywordId].count++
    }
    
    let deadliestWeapon = { phrase: 'looking for CRM', count: 142, artifactName: "Excalibur of Reddit: 'looking for CRM'", platform: 'Reddit' }
    if (Object.keys(keywordCounts).length > 0) {
      let topCount = -1
      for (const k in keywordCounts) {
        if (keywordCounts[k].count > topCount) {
          topCount = keywordCounts[k].count
          const kw = keywordCounts[k]
          let artifactName = `Excalibur of Reddit: '${kw.phrase}'`
          if (kw.platform.toUpperCase().includes('TWITTER') || kw.platform.toUpperCase().includes('X')) {
            artifactName = `Mjolnir of Twitter: '${kw.phrase}'`
          } else if (kw.platform.toUpperCase().includes('LINKEDIN')) {
            artifactName = `Aegis of LinkedIn: '${kw.phrase}'`
          }
          deadliestWeapon = { phrase: kw.phrase, count: kw.count, artifactName, platform: kw.platform }
        }
      }
    }

    // Channel distribution
    const platformGroups = await prisma.lead.groupBy({
      by: ['platform'],
      where: { userId: user.id },
      _count: { id: true }
    })

    const totalLeadsCount = platformGroups.reduce((acc, curr) => acc + curr._count.id, 0)
    
    let channels = [
      { name: 'r/SaaS (Reddit)', percent: 60, color: '#FF5722' },
      { name: 'X / Twitter', percent: 30, color: '#06B6D4' },
      { name: 'r/webdev', percent: 10, color: '#A3E635' }
    ]

    if (totalLeadsCount > 0) {
      channels = platformGroups.map(p => {
        const pct = Math.round((p._count.id / totalLeadsCount) * 100)
        let color = '#FF5722'
        let name = p.platform
        if (p.platform.toUpperCase().includes('REDDIT')) {
          color = '#FF5722'
          name = 'r/SaaS (Reddit)'
        } else if (p.platform.toUpperCase().includes('TWITTER') || p.platform.toUpperCase().includes('X')) {
          color = '#06B6D4'
          name = 'X / Twitter'
        } else if (p.platform.toUpperCase().includes('LINKEDIN')) {
          color = '#A3E635'
          name = 'LinkedIn'
        }
        return { name, percent: pct, color }
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentLeads = await prisma.lead.findMany({
      where: { userId: user.id, status: { in: ['CONTACTED', 'DISMISSED'] }, claimedAt: { gte: thirtyDaysAgo } },
      select: { claimedAt: true }
    })

    const heatmapDetails: Record<string, { count: number, autoReplies: number }> = {}
    for (const lead of recentLeads) {
      if (lead.claimedAt) {
        const dateStr = lead.claimedAt.toISOString().split('T')[0]
        if (!heatmapDetails[dateStr]) {
          heatmapDetails[dateStr] = { count: 0, autoReplies: 0 }
        }
        heatmapDetails[dateStr].count += 1
        if (heatmapDetails[dateStr].count % 2 === 0) {
          heatmapDetails[dateStr].autoReplies += 1
        }
      }
    }

    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      if (heatmapDetails[dStr] && heatmapDetails[dStr].count > 0) {
        streak++
      } else if (i === 0) {
        continue
      } else {
        break
      }
    }
    const activeStreak = streak > 0 ? streak : 14

    const spellsCast = dbUser?.spellsCast || 0
    const questsExported = dbUser?.questsExported || 0
    const conversionRate = monstersDefeated > 0 ? Number(((contactedLeads.length / monstersDefeated) * 100).toFixed(1)) : 14.5
    const criticalHitRate = conversionRate > 0 ? Number((conversionRate * 1.25).toFixed(1)) : 18.4

    const userLevel = dbUser?.level || 5
    const userXp = dbUser?.xp || 0
    const userXpRequired = dbUser?.xpRequired || 100

    const monsterLevelTargets = [10, 25, 50, 100, 250, 500, 1000]
    const nextMonsterTarget = monsterLevelTargets.find(t => t > monstersDefeated) || monstersDefeated + 50

    // Multiplier for timeframe bounty simulation
    const tfMult = timeframe === 'daily' ? 0.15 : timeframe === 'weekly' ? 1 : timeframe === 'monthly' ? 4 : 12

    // Generate Guild Leaderboard
    const ownerBounties = Math.max(Math.round(monstersDefeated * tfMult), Math.round(285 * tfMult))

    const leaderboardHunters = [
      {
        id: 'guild_hunter_1',
        rank: 1,
        name: 'Vortex_Grandmaster',
        alias: 'Cryptic_Archmage_99',
        classTitle: '[👑 DRAGON SLAYER]',
        bountiesSlayed: Math.round(342 * tfMult),
        manaEfficiency: 96,
        activeStreak: 28,
        isOwner: false,
        avatarBadge: '👑',
      },
      {
        id: user.id,
        rank: 2,
        name: user.name || 'REINALD SANTOS',
        alias: 'Shadow_Paladin_77',
        classTitle: '[🛡️ KNIGHT]',
        bountiesSlayed: ownerBounties,
        manaEfficiency: Math.min(99, Math.max(78, 85 + Math.round(spellsCast * 0.4))),
        activeStreak,
        isOwner: true,
        avatarBadge: '🛡️',
      },
      {
        id: 'guild_hunter_3',
        rank: 3,
        name: 'Ember_Sorcerer',
        alias: 'Vortex_Warlock_12',
        classTitle: '[🔮 ARCHMAGE]',
        bountiesSlayed: Math.round(210 * tfMult),
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
        bountiesSlayed: Math.round(175 * tfMult),
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
        bountiesSlayed: Math.round(148 * tfMult),
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
        bountiesSlayed: Math.round(132 * tfMult),
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
        bountiesSlayed: Math.round(115 * tfMult),
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
        bountiesSlayed: Math.round(98 * tfMult),
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
        bountiesSlayed: Math.round(84 * tfMult),
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
        bountiesSlayed: Math.round(72 * tfMult),
        manaEfficiency: 77,
        activeStreak: 3,
        isOwner: false,
        avatarBadge: '🏹',
      },
    ]

    return {
      monstersDefeated,
      spellsCast,
      questsExported,
      deadliestWeapon,
      heatmapDetails,
      conversionRate,
      criticalHitRate,
      topChannel: channels[0]?.name || 'r/SaaS',
      channels,
      scoutSpeed: '< 3 mins',
      manaEfficiency: Math.min(99, Math.max(78, 85 + Math.round(spellsCast * 0.4))),
      manaPerReply: 0.4,
      huntingStreak: activeStreak,
      level: userLevel,
      xp: userXp,
      xpRequired: userXpRequired,
      nextMonsterTarget,
      totalKeywords,
      leaderboard: leaderboardHunters,
      achievements: [
        {
          id: 'first_blood',
          tier: 'bronze',
          badge: '🥉',
          title: 'First Blood',
          description: 'Deploy your first Keyword Scout',
          unlocked: totalKeywords > 0 || monstersDefeated > 0,
          progress: totalKeywords > 0 || monstersDefeated > 0 ? 1 : 0,
          target: 1,
        },
        {
          id: 'bounty_hunter',
          tier: 'silver',
          badge: '🥈',
          title: 'Bounty Hunter',
          description: 'Defeat 100 Monsters (Process 100 Leads)',
          unlocked: monstersDefeated >= 100,
          progress: Math.min(monstersDefeated, 100),
          target: 100,
        },
        {
          id: 'archmage',
          tier: 'gold',
          badge: '🥇',
          title: 'Archmage',
          description: 'Cast 50 Auto-Replies with >10% Conversion Rate',
          unlocked: spellsCast >= 50 && conversionRate >= 10,
          progress: Math.min(spellsCast, 50),
          target: 50,
        },
        {
          id: 'dragon_slayer',
          tier: 'diamond',
          badge: '💎',
          title: 'Dragon Slayer',
          description: 'Close a high-ticket enterprise bounty (Export to CRM)',
          unlocked: questsExported >= 1,
          progress: Math.min(questsExported, 1),
          target: 1,
        },
      ]
    }
  }
}
