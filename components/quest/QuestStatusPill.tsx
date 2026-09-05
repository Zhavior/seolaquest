import clsx from 'clsx'
import { questSurface } from './questStyles'

export interface QuestStatusPillProps {
  /** Small grey caption, e.g. "SIGNAL STREAMS". */
  label: string
  /** Bold black value, e.g. "12 ACTIVE". */
  value: string
  /**
   * `live` pulses an emerald dot, `idle` shows a static grey dot.
   * The pulse is purely decorative and is disabled under reduced motion.
   */
  state?: 'live' | 'idle'
  className?: string
}

/**
 * The bordered status card in the top-right of every quest page header.
 */
export function QuestStatusPill({ label, value, state = 'live', className }: QuestStatusPillProps) {
  const isLive = state === 'live'

  return (
    <div className={questSurface({ className: clsx('flex items-center gap-3 px-5 py-3', className) })}>
      <span aria-hidden="true" className="relative flex h-4 w-4 shrink-0">
        {isLive ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
        ) : null}
        <span
          className={clsx(
            'relative inline-flex h-4 w-4 rounded-full border border-outline',
            isLive ? 'bg-emerald-500' : 'bg-zinc-400'
          )}
        />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-bold normal-case text-ink-muted">{label}</span>
        <span className="text-lg font-semibold normal-case leading-none text-ink">{value}</span>
      </div>
    </div>
  )
}

export default QuestStatusPill
