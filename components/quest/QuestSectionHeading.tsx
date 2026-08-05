import type { ReactNode } from 'react'
import clsx from 'clsx'
import { questSurface, type QuestTone } from './questStyles'

export interface QuestSectionHeadingProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Lucide icon element rendered inside the bordered icon tile. */
  icon?: ReactNode
  /** Background of the icon tile. */
  iconTone?: QuestTone
  /** Right-hand slot (status chip, count badge, control). */
  action?: ReactNode
  /** Heading level; keeps document outline correct per page. */
  as?: 'h2' | 'h3'
  /** `id` for the heading so panels can be labelled via aria-labelledby. */
  titleId?: string
  className?: string
}

/**
 * Panel header: icon tile + title + subtitle, separated by the signature
 * `border-b-4 border-black` rule. Used by The Armory, Activity Heatmap,
 * the guild ledger, achievements and the keyword monitor form.
 */
export function QuestSectionHeading({
  title,
  subtitle,
  icon,
  iconTone = 'gold',
  action,
  as: Heading = 'h2',
  titleId,
  className,
}: QuestSectionHeadingProps) {
  return (
    <div
      className={clsx(
        'mb-6 flex flex-col gap-3 border-b-4 border-black pb-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className={questSurface({
              tone: iconTone,
              border: 2,
              shadow: 'xs',
              className: 'flex shrink-0 items-center justify-center p-2.5',
            })}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <Heading id={titleId} className="text-2xl font-black uppercase leading-none md:text-3xl">
            {title}
          </Heading>
          {subtitle ? (
            <p className="mt-1 text-xs font-bold uppercase text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0 self-start sm:self-auto">{action}</div> : null}
    </div>
  )
}

export default QuestSectionHeading
