import Link from 'next/link'
import { formatAttempts, formatDeliveryTime } from '../deliveryView'
import type { DeliveryView } from '../types'
import { DeliveryStatusBadge } from './DeliveryStatusBadge'
import { RetryDeliveryForm } from './RetryDeliveryForm'

export function DeliveryDetail({ delivery }: { delivery: DeliveryView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="border-4 border-outline bg-card p-6 shadow-brutal-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-outline pb-5">
          <DeliveryStatusBadge status={delivery.status} />
          <Link href="/app/deliveries" className="text-sm font-black uppercase underline decoration-2 underline-offset-4">
            Back to deliveries
          </Link>
        </div>

        <h1 className="mt-6 text-3xl font-black uppercase sm:text-4xl">CRM delivery</h1>
        <p className="mt-3 max-w-2xl font-bold text-ink-muted">{delivery.statusMessage}</p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Delivery ID" value={delivery.id} mono />
          <DetailItem label="Lead ID" value={delivery.leadId} mono />
          <DetailItem label="Created" value={formatDeliveryTime(delivery.createdAt)} />
          <DetailItem label="Last updated" value={formatDeliveryTime(delivery.updatedAt)} />
          <DetailItem label="Delivered" value={formatDeliveryTime(delivery.deliveredAt)} />
          <DetailItem label="Attempts" value={formatAttempts(delivery.attempts, delivery.maxAttempts)} />
        </dl>
      </section>

      <aside className="h-fit border-4 border-outline bg-canvas p-5 shadow-brutal-lg">
        <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Retry policy</p>
        {delivery.canRetry ? (
          <>
            <h2 className="mt-2 text-xl font-black uppercase">Backend retry available</h2>
            <p className="mt-3 text-sm font-bold text-ink-muted">
              Retry is allowed because this delivery and its worker job have both stopped after automatic attempts.
            </p>
            <RetryDeliveryForm deliveryId={delivery.id} />
          </>
        ) : (
          <>
            <h2 className="mt-2 text-xl font-black uppercase">Manual retry unavailable</h2>
            <p className="mt-3 text-sm font-bold text-ink-muted">
              {delivery.status === 'DEAD'
                ? 'The backend does not currently mark this delivery as retryable. Refresh before taking another action.'
                : 'Manual retry appears only after the backend marks both the delivery and worker job as stopped.'}
            </p>
          </>
        )}
      </aside>
    </div>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-2 border-outline bg-inset p-4">
      <dt className="text-xs font-black uppercase text-ink-muted">{label}</dt>
      <dd className={`mt-1 break-words font-bold ${mono ? 'font-mono text-sm' : ''}`}>{value}</dd>
    </div>
  )
}
