import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface QuestTickerProps {
  /** Accessible label announced once to assistive tech. */
  label: string
  /** Visual message; repeated across the marquee. Falls back to `label`. */
  children?: ReactNode
  /** How many copies per marquee half. */
  repeat?: number
  className?: string
}

/**
 * The yellow neo-brutalist marquee banner that caps every quest screen.
 *
 * CSS-animation based (see `quest-marquee` in app/globals.css) so it works in
 * server components, costs no JS, and is disabled by the global
 * `prefers-reduced-motion` rule. The repeated copies are `aria-hidden`; the
 * message is exposed once via a visually hidden paragraph.
 */
export function QuestTicker({ label, children, repeat = 5, className }: QuestTickerProps) {
  const message = children ?? label
  const half = Array.from({ length: repeat })

  const group = (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center gap-10 pr-10 text-lg font-black uppercase tracking-widest md:text-xl"
    >
      {half.map((_, i) => (
        <span key={i} className="flex items-center gap-3">
          {message}
        </span>
      ))}
    </div>
  )

  return (
    <div
      className={clsx(
        'w-full max-w-full overflow-hidden whitespace-nowrap border-4 border-black bg-[#FFE600] py-2 shadow-[4px_4px_0_0_#000]',
        className
      )}
    >
      <div className="flex w-max animate-[quest-marquee_25s_linear_infinite] will-change-transform">
        {group}
        {group}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  )
}

export default QuestTicker
