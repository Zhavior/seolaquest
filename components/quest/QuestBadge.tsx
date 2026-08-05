import type { HTMLAttributes, ReactNode } from 'react'
import { questBadge, type QuestBorder, type QuestShadow, type QuestTone } from './questStyles'

export interface QuestBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: QuestTone
  shadow?: QuestShadow
  border?: QuestBorder
  /** Slight rotation used on Guild Hall eyebrow chips and ribbons. */
  tilt?: boolean
  icon?: ReactNode
  children: ReactNode
}

/**
 * The small uppercase chip used everywhere in the Guild Hall aesthetic
 * (`border-2 border-outline px-3 py-1 text-xs font-black uppercase shadow-brutal-sm`).
 */
export function QuestBadge({
  tone = 'gold',
  shadow = 'xs',
  border = 2,
  tilt = false,
  icon,
  className,
  children,
  ...rest
}: QuestBadgeProps) {
  return (
    <span
      {...rest}
      className={questBadge({
        tone,
        shadow,
        border,
        className: `${tilt ? '-rotate-1' : ''} ${className ?? ''}`.trim(),
      })}
    >
      {icon}
      {children}
    </span>
  )
}

export default QuestBadge
