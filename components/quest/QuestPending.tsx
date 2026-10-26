import clsx from 'clsx'

import { QuestPageShell } from './QuestPageShell'

export interface QuestPendingProps {
  label: string
  className?: string
}

/**
 * The landing page's pending mark: two gold octagonal rings turning around a
 * gem. Pure CSS (`.dq-loader*` in globals.css), so it costs no JavaScript and
 * holds still under reduced motion.
 */
export function DuskSigil({ size = 'large' }: { size?: 'large' | 'small' }) {
  return (
    <span aria-hidden="true" className={clsx('dq-loader-sigil', size === 'small' && 'dq-loader-sigil--small')}>
      <span className="dq-loader-gem" />
    </span>
  )
}

/**
 * A quiet, zero-JavaScript pending state for streamed server content.
 *
 * Loading UI should communicate that work is happening without drawing a fake
 * version of the destination page. The real content appears once, fully
 * formed, instead of swapping through a wall of placeholder cards.
 */
export function QuestPending({ label, className }: QuestPendingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx('flex min-h-28 items-center justify-center px-4 py-10', className)}
    >
      <span className="inline-flex items-center gap-4 text-left">
        <DuskSigil size="small" />
        <span className="dq-loader-label">{label}</span>
      </span>
    </div>
  )
}

/** Full-page version used by route-level `loading.tsx` boundaries. */
export function QuestRoutePending({ label }: QuestPendingProps) {
  return (
    <QuestPageShell gap="none" contentClassName="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
      <div role="status" aria-live="polite" aria-atomic="true" className="dq-loader">
        <DuskSigil />
        <span className="dq-loader-label">{label}</span>
      </div>
    </QuestPageShell>
  )
}
