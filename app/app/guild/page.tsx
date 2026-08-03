import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Loading from '../loading'

const GuildClient = dynamic(() => import('@/features/guild/components/GuildClient'))

export default function GuildPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GuildData />
    </Suspense>
  )
}

async function GuildData() {
  return (
    <GuildClient
      stats={{
        monstersDefeated: 0,
        spellsCast: 0,
        questsExported: 0,
        deadliestWeapon: {
          phrase: 'Loading',
          count: 0,
          artifactName: 'Stats deferred for faster page loads',
          platform: 'Unknown',
        },
        conversionRate: 0,
        criticalHitRate: 0,
        topChannel: 'Unknown',
        channels: [],
        scoutSpeed: 'Loading',
        manaEfficiency: 0,
        manaPerReply: 0,
        huntingStreak: 0,
        level: 1,
        xp: 0,
        xpRequired: 100,
        nextMonsterTarget: 1,
        totalKeywords: 0,
        leaderboard: [],
        achievements: [],
        heatmap: {},
        heatmapDetails: {},
      }}
    />
  )
}
