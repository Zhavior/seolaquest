import type { ReactNode } from 'react'
import clsx from 'clsx'
import { QUEST_TITLE_STROKE } from './questStyles'

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
          {icon ? <span aria-hidden="true" className="shrink-0 text-[#FF5722]">{icon}</span> : null}
          <span className="-rotate-1 border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase tracking-widest text-[#FFE600]">
            {eyebrow}
          </span>
        </div>

        <h1
          id={titleId}
          className="text-4xl uppercase tracking-tight text-white drop-shadow-[6px_6px_0_rgba(0,0,0,1)] sm:text-5xl md:text-7xl"
          style={QUEST_TITLE_STROKE}
        >
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 inline-block -rotate-1 border-2 border-black bg-black px-4 py-1 text-xl uppercase text-white md:text-2xl">
            {subtitle}
          </p>
        ) : null}
      </div>

      {status ? <div className="shrink-0">{status}</div> : null}
    </div>
  )
}

export default QuestPageHeader
