import clsx from 'clsx'
import type { ReactNode } from 'react'

export interface QuestTickerProps {
  label: string
  children?: ReactNode
  repeat?: number
  className?: string
}

/**
 * A quiet journal marker above the page title: one mono label on a gold rule,
 * the way the landing page sets its eyebrows. `children` is accepted for older
 * call sites and not rendered.
 */
export function QuestTicker({ label, className }: QuestTickerProps) {
  return (
    <p className={clsx('dq-eyebrow flex items-center gap-3', className)}>
      <span aria-hidden="true" className="inline-block size-2 rotate-45 bg-accent" />
      <span className="min-w-0">{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-[#8a6420] to-transparent" />
    </p>
  )
}

export default QuestTicker
