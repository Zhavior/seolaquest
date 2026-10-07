import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface QuestPageHeaderProps {
  /** Small mono kicker above the title, e.g. "COMMANDER'S MAP". */
  eyebrow: ReactNode
  /** Lucide icon set in the gold octagon beside the title. */
  icon?: ReactNode
  title: ReactNode
  /** Line under the title. */
  subtitle?: ReactNode
  /** Right-hand slot, typically a `<QuestStatusPill>`. */
  status?: ReactNode
  /** `id` for the `h1`, so the page region can use aria-labelledby. */
  titleId?: string
  className?: string
}

const OCTAGON = 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)'

/**
 * Page title block in the landing page's voice: the icon on a gold octagon
 * plate, a mono eyebrow, the title in gilded blackletter, and an optional
 * status card on the right.
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
        'flex flex-col items-start justify-between gap-5 md:flex-row md:items-end',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-4 sm:gap-5">
        {icon ? (
          <span
            aria-hidden="true"
            className="mt-1 hidden size-16 shrink-0 place-items-center bg-gradient-to-b from-[#f3d58a] via-[#d8a93b] to-[#8a6420] p-[2px] sm:grid"
            style={{ clipPath: OCTAGON }}
          >
            <span
              className="grid size-full place-items-center bg-gradient-to-b from-[#241b44] to-[#0e0a1c] text-[#f3d58a] [&_svg]:size-7"
              style={{ clipPath: OCTAGON }}
            >
              {icon}
            </span>
          </span>
        ) : null}

        <div className="min-w-0">
          <p className="dq-eyebrow">{eyebrow}</p>

          <h1 id={titleId} className="dq-title mt-2 text-[2.6rem] sm:text-6xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {status ? <div className="shrink-0">{status}</div> : null}
    </div>
  )
}

export default QuestPageHeader
