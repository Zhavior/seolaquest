import type { ScanStatus } from '../types'

const styles: Record<ScanStatus, string> = {
  QUEUED: 'bg-[#FFE600] text-black',
  RUNNING: 'bg-sky-300 text-black',
  SUCCEEDED: 'bg-[#A3E635] text-black',
  FAILED_REFUNDED: 'bg-orange-300 text-black',
  DEAD: 'bg-[#FF5722] text-white',
  CANCELLED: 'bg-zinc-700 text-white',
  UNKNOWN: 'bg-zinc-200 text-zinc-800',
}

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  return (
    <span
      className={`inline-flex border-2 border-black px-2.5 py-1 text-xs font-black tracking-wide shadow-[2px_2px_0_0_#000] ${styles[status]}`}
    >
      {status}
    </span>
  )
}
