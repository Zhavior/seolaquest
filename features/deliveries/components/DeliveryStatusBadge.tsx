import type { DeliveryStatus } from '../types'

const styles: Record<DeliveryStatus, string> = {
  QUEUED: 'bg-accent text-on-accent',
  DELIVERED: 'bg-success text-on-accent',
  DEAD: 'bg-accent-2 text-white',
  UNKNOWN: 'bg-inset text-ink',
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-flex border-2 border-outline px-2.5 py-1 text-xs font-black tracking-wide shadow-brutal-sm ${styles[status]}`}
    >
      {status}
    </span>
  )
}
