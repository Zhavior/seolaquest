import clsx from 'clsx'
import { questSurface, type QuestBorder, type QuestShadow, type QuestTone } from './questStyles'

export interface QuestCount {
  label: string
  value: number | string
  /** Optional per-tile background, e.g. `bg-accent`. */
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
  tone = 'sand',
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
          'grid grid-cols-1 divide-y-2 divide-black sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0',
          className
        ),
      })}
    >
      {counts.map((count) => (
        <div key={count.label} className={clsx('min-w-0 p-3.5', count.accent)}>
          <dt className="text-[10px] font-black uppercase tracking-wider text-ink/60">
            {count.label}
          </dt>
          <dd
            className={clsx(
              'mt-1 font-black text-ink',
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
