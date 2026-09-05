import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

interface HQBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
}

/**
 * Badges sit one step down the border/shadow scale from containers: `border-2`
 * and `shadow-brutal-sm` against a container's `border-4` and `shadow-brutal`.
 * Two steps is a system; a third is where the scale starts looking arbitrary.
 *
 * Every tone here is a bright fill, so the ink inversion in globals.css pins
 * the label to black in all three themes — no `text-black` needed.
 */
const tones: Record<Tone, string> = {
  neutral: 'bg-inset text-ink',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function HQBadge({ children, className, icon, tone = 'neutral', ...props }: HQBadgeProps) {
  return (
    <span
      {...props}
      className={clsx(
        'inline-flex items-center gap-1',
        'border border-outline px-2 py-0.5 rounded-xl',
        'text-xs font-semibold normal-case tracking-[0.12em]',
        'shadow-brutal-sm',
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export default HQBadge
