import clsx from 'clsx'

import { QuestPageShell } from './QuestPageShell'

export interface QuestPendingProps {
  label: string
  className?: string
}

/**
 * A quiet, zero-JavaScript pending state for streamed server content.
 *
 * Loading UI should communicate that work is happening without drawing a fake
 * version of the destination page. The real content appears once, fully
 * formed, instead of swapping through a wall of bordered placeholder cards.
 */
export function QuestPending({ label, className }: QuestPendingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx('flex min-h-28 items-center justify-center px-4 py-10', className)}
    >
      <span className="inline-flex items-center gap-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-ink-muted">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-accent motion-safe:animate-pulse"
        />
        {label}
      </span>
    </div>
  )
}

/** Full-page version used by route-level `loading.tsx` boundaries. */
export function QuestRoutePending({ label }: QuestPendingProps) {
  return (
    <QuestPageShell gap="none" contentClassName="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <QuestPending label={label} className="min-h-0 py-0" />
    </QuestPageShell>
  )
}
