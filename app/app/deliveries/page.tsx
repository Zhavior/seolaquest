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
  title: 'CRM exports | SEOlaQuest',
  description: 'Review the recorded worker status and dispatch history of your CRM deliveries.',
}

export default function DeliveriesPage() {
  return (
    <QuestPageShell watermark={<Radio className="h-[650px] w-[650px] text-ink" />}>
      <QuestTicker label="CRM exports.">
        <Sparkles className="h-5 w-5 text-ink" /> 📡 CRM EXPORTS{' '}
        <Sparkles className="h-5 w-5 text-ink" /> 🛡️ LEADS SENT TO YOUR CRM
      </QuestTicker>

      <QuestPageHeader
        className="mt-4"
        icon={<Radio className="h-8 w-8" />}
        eyebrow={<>YOUR CRM</>}
        title="CRM exports"
        subtitle="Leads you sent to your CRM"
        status={<QuestStatusPill label="Sending" value="On" />}
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
