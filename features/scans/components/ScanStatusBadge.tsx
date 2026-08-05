import { questBadge } from '@/components/quest'
import type { ScanStatus } from '../types'

const styles: Record<ScanStatus, string> = {
  QUEUED: 'bg-accent text-on-accent',
  RUNNING: 'bg-sky-300 text-on-accent',
  SUCCEEDED: 'bg-success text-on-accent',
  FAILED_REFUNDED: 'bg-orange-300 text-on-accent',
  DEAD: 'bg-accent-2 text-white',
  CANCELLED: 'bg-zinc-700 text-white',
  UNKNOWN: 'bg-inset text-ink',
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
