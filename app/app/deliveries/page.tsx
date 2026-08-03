import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DeliveryList } from '@/features/deliveries/components/DeliveryList'
import { listCurrentUserDeliveries } from '@/features/deliveries/queries'
import DeliveriesLoading from './loading'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CRM Deliveries | CoQuest',
  description: 'Review the recorded status of your CRM deliveries.',
}

export default function DeliveriesPage() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Delivery ledger</p>
          <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl">CRM deliveries</h1>
          <p className="mt-3 max-w-2xl font-bold text-zinc-700">
            Recorded worker status only. Queued means pending, and delivered means your CRM accepted the request.
          </p>
        </header>
        <Suspense fallback={<DeliveriesLoading />}>
          <DeliveryListData />
        </Suspense>
      </div>
    </div>
  )
}

async function DeliveryListData() {
  const result = await listCurrentUserDeliveries()
  return <DeliveryList {...result} />
}
