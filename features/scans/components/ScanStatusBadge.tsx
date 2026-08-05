import { questBadge } from '@/components/quest'
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
      className={questBadge({
        tone: 'none',
        className: `px-2.5 py-1 tracking-wide ${styles[status]}`,
      })}
    >
      {status}
    </span>
  )
}
