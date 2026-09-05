import clsx from 'clsx'
import type { ReactNode } from 'react'

export interface QuestTickerProps {
  label: string
  children?: ReactNode
  repeat?: number
  className?: string
}

/** A quiet journal marker; one readable label instead of repeating motion. */
export function QuestTicker({ label, className }: QuestTickerProps) {
  return <p className={clsx('border-b border-hairline pb-4 text-xs font-medium tracking-wide text-ink-muted', className)}>{label}</p>
}

export default QuestTicker
