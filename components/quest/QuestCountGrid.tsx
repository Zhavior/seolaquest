import clsx from 'clsx'
import { questSurface, type QuestBorder, type QuestShadow, type QuestTone } from './questStyles'

export interface QuestCount {
  label: string
  value: number | string
  /** Optional numeral colour, e.g. `text-accent`. Tiles stay dark glass. */
  accent?: string
}

export interface QuestCountGridProps {
  counts: QuestCount[]
  tone?: QuestTone
  border?: QuestBorder
  shadow?: QuestShadow
  /** Emphasised numerals (scan run cards) vs. compact (detail panel). */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Divided counter strip used by the scan-run ledger and run detail panel.
 * Stacks on phones and splits into three columns from `sm` up, so the numerals
 * never overflow narrow viewports.
 */
export function QuestCountGrid({
  counts,
  tone = 'muted',
  border = 3,
  shadow = 'sm',
  size = 'md',
  className,
}: QuestCountGridProps) {
  return (
    <dl
      className={questSurface({
        tone,
        border,
        shadow,
        className: clsx(
          'grid grid-cols-1 divide-y divide-outline sm:grid-cols-3 sm:divide-x sm:divide-y-0',
          className
        ),
      })}
    >
      {counts.map((count) => (
        <div key={count.label} className="min-w-0 p-3.5">
          <dt className="dq-section-label">{count.label}</dt>
          <dd
            className={clsx(
              'mt-1 font-mono font-semibold',
              count.accent ?? 'text-ink',
              size === 'md' ? 'text-xl sm:text-2xl' : 'text-2xl'
            )}
          >
            {count.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default QuestCountGrid
