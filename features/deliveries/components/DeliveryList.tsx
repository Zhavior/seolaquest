'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Search, X, ShieldAlert } from 'lucide-react'
import { formatAttempts, formatDeliveryTime, shortDeliveryId } from '../deliveryView'
import type { DeliveryListResult, DeliveryView } from '../types'
import { DeliveryStatusBadge } from './DeliveryStatusBadge'
import { loadMoreDeliveriesAction, pollPendingDeliveriesAction } from '../actions'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } },
}

export function DeliveryList({ deliveries: initialDeliveries, hasMore: initialHasMore }: DeliveryListResult) {
  const [deliveries, setDeliveries] = useState<DeliveryView[]>(initialDeliveries)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const shouldReduceMotion = useReducedMotion()

  // Poll for pending deliveries
  useEffect(() => {
    const pendingIds = deliveries.filter((d) => d.status === 'QUEUED').map((d) => d.id)
    if (pendingIds.length === 0) return

    const interval = setInterval(() => {
      pollPendingDeliveriesAction(pendingIds).then((updates) => {
        if (updates.length > 0) {
          setDeliveries((currentDeliveries) => {
            const updated = [...currentDeliveries]
            let changed = false
            updates.forEach((u) => {
              const index = updated.findIndex((d) => d.id === u.id)
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
      setDeliveries((current) => [...current, ...result.deliveries])
      setHasMore(result.hasMore)
    })
  }

  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return deliveries
    const q = searchQuery.toLowerCase()
    return deliveries.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q) ||
        d.statusMessage.toLowerCase().includes(q)
    )
  }, [deliveries, searchQuery])

  if (deliveries.length === 0) {
    return (
      <div className="border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0_0_#000]">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_0_#000]">
          <ShieldAlert className="h-4 w-4" />
          No CRM deliveries yet
        </div>
        <h2 className="text-2xl font-black uppercase sm:text-3xl">Exports will appear here after you send a lead.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-black/70">
          This page reports backend delivery state. It does not claim a CRM accepted anything until the worker records delivery.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex border-4 border-black bg-[#FFE600] px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-yellow-300 active:translate-y-0.5"
        >
          Return to command deck
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial={shouldReduceMotion ? 'show' : 'hidden'}
      animate="show"
      className="space-y-6"
    >
      {/* Search & Quick Controls */}
      <motion.div variants={item} className="relative flex items-center border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
        <Search className="absolute left-3.5 h-4 w-4 text-black/60 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH DELIVERY ID OR STATUS..."
          className="w-full bg-transparent py-3 pl-10 pr-10 text-xs sm:text-sm font-black uppercase text-black placeholder:text-black/40 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1 text-black/60 hover:text-black"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <motion.div key={delivery.id} variants={item}>
            <Link
              href={`/app/deliveries/${delivery.id}`}
              className="group grid gap-4 border-4 border-black bg-white p-5 shadow-[6px_6px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_#000] md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <DeliveryStatusBadge status={delivery.status} />
                  <span className="border-2 border-black bg-[#FFE600] px-2.5 py-0.5 font-mono text-xs font-black shadow-[2px_2px_0_0_#000]">
                    DELIVERY {shortDeliveryId(delivery.id)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-black uppercase text-black">{delivery.statusMessage}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/60">
                  Updated: {formatDeliveryTime(delivery.updatedAt)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-5 border-t-3 border-black pt-3 md:block md:min-w-36 md:border-l-3 md:border-t-0 md:pl-5 md:pt-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-black/60">Delivery Attempts</span>
                <div className="mt-1 border-2 border-black bg-[#FFF8D9] px-3 py-1.5 font-black text-sm text-black shadow-[2px_2px_0_0_#000]">
                  {formatAttempts(delivery.attempts, delivery.maxAttempts)}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <motion.div variants={item} className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="border-4 border-black bg-[#FFE600] px-6 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 transition-all hover:bg-yellow-300 text-black"
          >
            {isPending ? 'Loading...' : 'Load older deliveries'}
          </button>
        </motion.div>
      )}
      {!hasMore && deliveries.length > 0 && (
        <motion.p variants={item} className="border-3 border-black bg-white p-3 text-center text-xs font-black uppercase shadow-[3px_3px_0_0_#000] text-black">
          End of deliveries.
        </motion.p>
      )}
    </motion.div>
  )
}
