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

import { AnalyticsService } from '@/src/modules/analytics/application/AnalyticsService'

async function GuildData() {
  const stats = await AnalyticsService.getGuildStats('weekly')
  return <GuildClient stats={stats} />
}
