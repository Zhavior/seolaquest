import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface QuestPageHeaderProps {
  /** Small uppercase kicker inside the black chip, e.g. "COMMANDER'S MAP". */
  eyebrow: ReactNode
  /** Lucide icon rendered next to the eyebrow chip. */
  icon?: ReactNode
  title: ReactNode
  /** Ribbon under the title. */
  subtitle?: ReactNode
  /** Right-hand slot, typically a `<QuestStatusPill>`. */
  status?: ReactNode
  /** `id` for the `h1`, so the page region can use aria-labelledby. */
  titleId?: string
  className?: string
}

/**
 * Guild Hall page title block: icon + rotated black eyebrow chip, outlined
 * display heading, rotated subtitle ribbon, and an optional status card.
 */
export function QuestPageHeader({
  eyebrow,
  icon,
  title,
  subtitle,
  status,
  titleId,
  className,
}: QuestPageHeaderProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-start justify-between gap-4 md:flex-row md:items-end',
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-3">
          {icon ? <span aria-hidden="true" className="shrink-0 text-ink-muted">{icon}</span> : null}
          <span className="rounded-full border border-hairline bg-inset px-3 py-1.5 text-xs font-semibold tracking-wide text-ink-muted">
            {eyebrow}
          </span>
        </div>

        <h1
          id={titleId}
          className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl"
        >
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {status ? <div className="shrink-0">{status}</div> : null}
    </div>
  )
}

export default QuestPageHeader
