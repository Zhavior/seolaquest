import { LeadStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { readHunterProgression } from '@/src/modules/gamify/hunterProgression'

const PROGRESSED_STATUSES = [LeadStatus.CLAIMED, LeadStatus.CONTACTED, LeadStatus.REPLIED, LeadStatus.QUALIFIED, LeadStatus.CONVERTED]
const DAY_MS = 24 * 60 * 60 * 1000

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildRecentUtcDays(count: number, now = new Date()) {
  const today = new Date(now)
  today.setUTCHours(0, 0, 0, 0)

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() - (count - index - 1))
    return date
  })
}

function platformColor(platform: string) {
  const normalized = platform.toUpperCase()
  if (normalized.includes('TWITTER') || normalized === 'X') return '#06B6D4'
  if (normalized.includes('LINKEDIN')) return '#A3E635'
  return '#FF5722'
}

export class AnalyticsService {
  static async getAnalytics() {
    const user = await requireCurrentUser()
    const days = buildRecentUtcDays(7)
    const start = days[0]

    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        status: { in: [...PROGRESSED_STATUSES, LeadStatus.DISMISSED] },
        OR: [{ claimedAt: { gte: start } }, { dismissedAt: { gte: start } }],
      },
      select: { status: true, claimedAt: true, contactedAt: true, dismissedAt: true },
    })

    return days.map((date) => {
      const dayStart = date.getTime()
      const dayEnd = dayStart + DAY_MS
      const dayLeads = leads.filter((lead) => {
        const timestamp = lead.status !== LeadStatus.DISMISSED
          ? lead.claimedAt?.getTime()
          : lead.dismissedAt?.getTime()
        return timestamp !== undefined && timestamp >= dayStart && timestamp < dayEnd
      })

      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        claimed: dayLeads.filter((lead) => lead.status !== LeadStatus.DISMISSED).length,
        dismissed: dayLeads.filter((lead) => lead.status === LeadStatus.DISMISSED).length,
      }
    })
  }

  static async getLeaderboard() {
    await requireCurrentUser()

    // Cross-tenant rankings require explicit participation and a public-profile DTO.
    // Until that consent model exists, the safe and truthful result is no leaderboard.
    return []
  }

  static async getGuildStats(_timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'weekly') {
    void _timeframe
    const user = await requireCurrentUser()
    const thirtyDays = buildRecentUtcDays(30)
    const thirtyDaysAgo = thirtyDays[0]

    const [dbUser, totalKeywords, monstersDefeated, topKeywords, platformGroups, recentLeads] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: {
            spellsCast: true,
            questsExported: true,
          },
        }),
        prisma.trackedKeyword.count({ where: { userId: user.id } }),
        prisma.lead.count({
          where: { userId: user.id, status: { in: [...PROGRESSED_STATUSES, LeadStatus.DISMISSED] } },
        }),
        prisma.$queryRaw<Array<{ phrase: string; count: number; platform: string }>>`
          SELECT k."phrase", COUNT(*)::integer AS "count", MIN(l."platform") AS "platform"
          FROM "Lead" l JOIN "TrackedKeyword" k ON k."id" = l."keywordId"
          WHERE l."userId" = ${user.id} AND k."userId" = ${user.id} AND l."contactedAt" IS NOT NULL
          GROUP BY l."keywordId", k."phrase"
          ORDER BY "count" DESC, l."keywordId" ASC LIMIT 1
        `,
        prisma.lead.groupBy({
          by: ['platform'],
          where: { userId: user.id },
          _count: { id: true },
        }),
        prisma.lead.findMany({
          where: {
            userId: user.id,
            status: { in: [...PROGRESSED_STATUSES, LeadStatus.DISMISSED] },
            claimedAt: { gte: thirtyDaysAgo },
          },
          select: { status: true, claimedAt: true, contactedAt: true, dismissedAt: true },
        }),
      ])

    const topKeyword = topKeywords[0]
    const deadliestWeapon = topKeyword
      ? {
          phrase: topKeyword.phrase,
          count: topKeyword.count,
          artifactName: `${topKeyword.platform}: '${topKeyword.phrase}'`,
          platform: topKeyword.platform,
        }
      : { phrase: 'None yet', count: 0, artifactName: 'No contacted-keyword data yet', platform: 'Unknown' }

    const totalLeads = platformGroups.reduce((sum, group) => sum + group._count.id, 0)
    const channels = totalLeads === 0
      ? []
      : [...platformGroups]
          .sort((a, b) => b._count.id - a._count.id)
          .map((group) => ({
            name: group.platform,
            percent: Math.round((group._count.id / totalLeads) * 100),
            color: platformColor(group.platform),
          }))

    const heatmapDetails: Record<string, { count: number; autoReplies: number }> = {}
    for (const lead of recentLeads) {
      const activityAt = lead.status === LeadStatus.DISMISSED ? lead.dismissedAt : lead.claimedAt
      if (!activityAt) continue
      const date = utcDateKey(activityAt)
      const current = heatmapDetails[date] ?? { count: 0, autoReplies: 0 }
      heatmapDetails[date] = { count: current.count + 1, autoReplies: 0 }
    }

    let huntingStreak = 0
    for (let index = thirtyDays.length - 1; index >= 0; index--) {
      if ((heatmapDetails[utcDateKey(thirtyDays[index])]?.count ?? 0) === 0) break
      huntingStreak += 1
    }

    // Progression comes from the Gamify ledger, which is the only system that
    // can account for every point it reports. The `User.level`/`User.xp` columns
    // this used to read are no longer written by anything.
    const { level, xp, xpRequired } = await readHunterProgression(user.id)
    const spellsCast = dbUser?.spellsCast ?? 0
    const questsExported = dbUser?.questsExported ?? 0
    const targets = [10, 25, 50, 100, 250, 500, 1000]
    const nextMonsterTarget = targets.find((target) => target > monstersDefeated) ?? monstersDefeated + 50

    return {
      monstersDefeated,
      spellsCast,
      questsExported,
      deadliestWeapon,
      heatmapDetails,
      conversionRate: 0,
      criticalHitRate: 0,
      topChannel: channels[0]?.name ?? 'Unknown',
      channels,
      scoutSpeed: 'Not measured',
      manaEfficiency: 0,
      manaPerReply: 0,
      huntingStreak,
      level,
      xp,
      xpRequired,
      nextMonsterTarget,
      totalKeywords,
      leaderboard: [],
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
          description: 'Process 100 leads',
          unlocked: monstersDefeated >= 100,
          progress: Math.min(monstersDefeated, 100),
          target: 100,
        },
        {
          id: 'archmage',
          tier: 'gold',
          badge: '🥇',
          title: 'Archmage',
          description: 'Generate 50 AI reply drafts',
          unlocked: spellsCast >= 50,
          progress: Math.min(spellsCast, 50),
          target: 50,
        },
        {
          id: 'exporter',
          tier: 'diamond',
          badge: '💎',
          title: 'Exporter',
          description: 'Complete your first CRM export',
          unlocked: questsExported >= 1,
          progress: Math.min(questsExported, 1),
          target: 1,
        },
      ],
    }
  }
}
