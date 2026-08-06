import type { Metadata } from 'next'
import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { Radio, Sparkles } from 'lucide-react'
import { listCurrentUserDeliveries } from '@/features/deliveries/queries'
import { QuestPageHeader, QuestPageShell, QuestStatusPill, QuestTicker } from '@/components/quest'
import { DeliveryListSkeleton } from './loading'

const DeliveryList = nextDynamic(() =>
  import('@/features/deliveries/components/DeliveryList').then((m) => m.DeliveryList)
)

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Campaign Broadcast & CRM Deliveries | SEOlaQuest',
  description: 'Review the recorded worker status and dispatch history of your CRM deliveries.',
}

export default function DeliveriesPage() {
  return (
    <QuestPageShell watermark={<Radio className="h-[650px] w-[650px] text-ink" />}>
      <QuestTicker label="Campaign broadcast. CRM dispatch ledger.">
        <Sparkles className="h-5 w-5 text-ink" /> 📡 CAMPAIGN BROADCAST{' '}
        <Sparkles className="h-5 w-5 text-ink" /> 🛡️ CRM DISPATCH LEDGER
      </QuestTicker>

      <QuestPageHeader
        className="mt-4"
        icon={<Radio className="h-8 w-8" />}
        eyebrow={<>COMMANDER&apos;S MAP &amp; CAMPAIGN DISPATCHES</>}
        title="Campaign Broadcast"
        subtitle="CRM Deliveries & Recorded Worker Status"
        status={<QuestStatusPill label="Dispatch engine" value="Active [Monitored]" />}
      />

      <Suspense fallback={<DeliveryListSkeleton />}>
        <DeliveryListData />
      </Suspense>
    </QuestPageShell>
  )
}

async function DeliveryListData() {
  const result = await listCurrentUserDeliveries()
  return <DeliveryList {...result} />
}
