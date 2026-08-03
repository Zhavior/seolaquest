'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { formatAttempts, formatDeliveryTime, shortDeliveryId } from '../deliveryView'
import type { DeliveryListResult, DeliveryView } from '../types'
import { DeliveryStatusBadge } from './DeliveryStatusBadge'
import { loadMoreDeliveriesAction, pollPendingDeliveriesAction } from '../actions'

export function DeliveryList({ deliveries: initialDeliveries, hasMore: initialHasMore }: DeliveryListResult) {
  const [deliveries, setDeliveries] = useState<DeliveryView[]>(initialDeliveries)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()

  // Poll for pending deliveries
  useEffect(() => {
    const pendingIds = deliveries.filter(d => d.status === 'QUEUED').map(d => d.id)
    if (pendingIds.length === 0) return

    const interval = setInterval(() => {
      pollPendingDeliveriesAction(pendingIds).then((updates) => {
        if (updates.length > 0) {
          setDeliveries(currentDeliveries => {
            const updated = [...currentDeliveries]
            let changed = false
            updates.forEach(u => {
              const index = updated.findIndex(d => d.id === u.id)
              if (index !== -1 && updated[index].status !== u.status) {
                updated[index] = { ...updated[index], ...u }
                changed = true
              }
            })
            return changed ? updated : currentDeliveries
          })
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [deliveries])

  const loadMore = () => {
    if (isPending || !hasMore || deliveries.length === 0) return
    const cursor = deliveries[deliveries.length - 1].id
    startTransition(async () => {
      const result = await loadMoreDeliveriesAction(cursor)
      setDeliveries(current => [...current, ...result.deliveries])
      setHasMore(result.hasMore)
    })
  }

  if (deliveries.length === 0) {
    return (
      <section className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No CRM deliveries yet</p>
        <h2 className="mt-3 text-2xl font-black uppercase">Exports will appear here after you send a lead.</h2>
        <p className="mx-auto mt-3 max-w-xl font-bold text-zinc-600">
          This page reports backend delivery state. It does not claim a CRM accepted anything until the worker records delivery.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-yellow-300"
        >
          Return to dashboard
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Link
            key={delivery.id}
            href={`/app/deliveries/${delivery.id}`}
            className="grid gap-4 border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000] transition-transform hover:-translate-y-0.5 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <DeliveryStatusBadge status={delivery.status} />
                <p className="font-mono text-sm font-black">Delivery {shortDeliveryId(delivery.id)}</p>
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-600">{delivery.statusMessage}</p>
              <p className="mt-3 text-xs font-black uppercase text-zinc-500">
                Updated {formatDeliveryTime(delivery.updatedAt)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-5 border-t-2 border-black pt-3 md:block md:min-w-32 md:border-l-2 md:border-t-0 md:pl-5 md:pt-0">
              <span className="text-xs font-black uppercase text-zinc-500">Attempts</span>
              <p className="font-black md:mt-1">{formatAttempts(delivery.attempts, delivery.maxAttempts)}</p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="border-4 border-black bg-white px-6 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_0px_0_0_#000] disabled:opacity-50 transition-all"
          >
            {isPending ? 'Loading...' : 'Load older deliveries'}
          </button>
        </div>
      )}
      {!hasMore && deliveries.length > 0 && (
        <p className="border-2 border-black bg-zinc-100 p-3 text-center text-xs font-black uppercase">
          End of deliveries.
        </p>
      )}
    </div>
  )
}
