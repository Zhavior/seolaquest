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
      }).catch(() => {
        // Background poll: a rejection here is not actionable by the user and must not
        // surface as an unhandled rejection. The action rethrows (onError: 'rethrow'), and
        // since it is now rate limited it can reject on a spent budget as well as on a dead
        // session. The next tick retries; the row keeps its last known status until then.
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
      <div className="border border-outline bg-card p-8 text-center shadow-brutal-lg rounded-xl">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 border border-outline bg-accent px-3 py-1 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl">
          <ShieldAlert className="h-4 w-4" />
          No CRM deliveries yet
        </div>
        <h2 className="text-2xl font-semibold normal-case sm:text-3xl">Exports will appear here after you send a lead.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-ink-muted">
          This page reports backend delivery state. It does not claim a CRM accepted anything until the worker records delivery.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex border border-outline bg-accent px-6 py-3 text-sm font-semibold normal-case shadow-brutal hover:bg-yellow-300 active:translate-y-0.5 rounded-xl"
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
      <motion.div variants={item} className="relative flex items-center border border-outline bg-card shadow-brutal rounded-xl">
        <Search className="absolute left-3.5 h-4 w-4 text-ink-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH DELIVERY ID OR STATUS..."
          className="w-full bg-transparent py-3 pl-10 pr-10 text-xs sm:text-sm font-semibold normal-case text-ink placeholder:text-ink-muted focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1 text-ink-muted hover:text-ink"
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
              className="group grid gap-4 border border-outline bg-card p-5 shadow-brutal-lg transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg md:grid-cols-[minmax(0,1fr)_auto] rounded-xl"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <DeliveryStatusBadge status={delivery.status} />
                  <span className="border border-outline bg-accent px-2.5 py-0.5 font-mono text-xs font-semibold shadow-brutal-sm rounded-xl">
                    DELIVERY {shortDeliveryId(delivery.id)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold normal-case text-ink">{delivery.statusMessage}</p>
                <p className="mt-2 text-xs font-bold normal-case text-ink-muted">
                  Updated: {formatDeliveryTime(delivery.updatedAt)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-5 border-t border-outline pt-3 md:block md:min-w-36 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <span className="text-[10px] font-semibold normal-case tracking-wider text-ink-muted">Delivery Attempts</span>
                <div className="mt-1 border border-outline bg-highlight px-3 py-1.5 font-semibold text-sm text-on-accent shadow-brutal-sm rounded-xl">
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
            className="border border-outline bg-accent px-6 py-3 font-semibold normal-case shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 transition-all hover:bg-yellow-300 text-on-accent rounded-xl"
          >
            {isPending ? 'Loading...' : 'Load older deliveries'}
          </button>
        </motion.div>
      )}
      {!hasMore && deliveries.length > 0 && (
        <motion.p variants={item} className="border border-outline bg-card p-3 text-center text-xs font-semibold normal-case shadow-brutal-sm text-ink rounded-xl">
          End of deliveries.
        </motion.p>
      )}
    </motion.div>
  )
}
