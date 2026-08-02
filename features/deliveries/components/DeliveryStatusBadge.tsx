import type { DeliveryStatus } from '../types'

const styles: Record<DeliveryStatus, string> = {
  QUEUED: 'bg-[#FFE600] text-black',
  DELIVERED: 'bg-[#A3E635] text-black',
  DEAD: 'bg-[#FF5722] text-white',
  UNKNOWN: 'bg-zinc-200 text-zinc-800',
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-flex border-2 border-black px-2.5 py-1 text-xs font-black tracking-wide shadow-[2px_2px_0_0_#000] ${styles[status]}`}
    >
      {status}
    </span>
  )
}
