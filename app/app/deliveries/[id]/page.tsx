import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DeliveryDetail } from '@/features/deliveries/components/DeliveryDetail'
import { getCurrentUserDelivery } from '@/features/deliveries/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CRM Delivery | CoQuest',
  description: 'Review one recorded CRM delivery.',
}

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const delivery = await getCurrentUserDelivery(id)
  if (!delivery) notFound()

  return (
    <div className="min-h-screen bg-[#F4F0EA] p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <DeliveryDetail delivery={delivery} />
      </div>
    </div>
  )
}
