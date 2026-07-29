import { getGuildStatsAction } from '../actions'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Loading from '../loading'

const GuildClient = dynamic(() => import('./GuildClient'))

export default function GuildPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GuildData />
    </Suspense>
  )
}

async function GuildData() {
  const stats = await getGuildStatsAction()
  
  return <GuildClient stats={stats} />
}
