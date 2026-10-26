import clsx from 'clsx'

export interface QuestStatusPillProps {
  /** Small mono caption, e.g. "SIGNAL STREAMS". */
  label: string
  /** The value, e.g. "12 ACTIVE". */
  value: string
  /**
   * `live` pulses a teal gem, `idle` shows a dim one.
   * The pulse is purely decorative and is disabled under reduced motion.
   */
  state?: 'live' | 'idle'
  className?: string
}

/**
 * The status card in the top-right of every quest page header: dark glass,
 * a gold edge and a diamond gem for state.
 */
export function QuestStatusPill({ label, value, state = 'live', className }: QuestStatusPillProps) {
  const isLive = state === 'live'

  return (
    <div className={clsx('dq-glass flex items-center gap-3 border-[#8a6420] px-5 py-3', className)}>
      <span aria-hidden="true" className="relative flex size-3.5 shrink-0 rotate-45">
        {isLive ? (
          <span className="absolute inline-flex size-full animate-ping bg-success opacity-60 motion-reduce:animate-none" />
        ) : null}
        <span className={clsx('relative inline-flex size-3.5', isLive ? 'bg-success' : 'bg-[#5a4d7a]')} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="dq-section-label">{label}</span>
        <span className="font-display text-lg font-semibold leading-none text-[#f6ebd2]">{value}</span>
      </div>
    </div>
  )
}

export default QuestStatusPill
