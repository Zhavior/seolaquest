import type { ReactNode } from 'react'
import clsx from 'clsx'

/** Parchment / commander's map paper grain used behind every quest screen. */
const PARCHMENT_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`

export interface QuestPageShellProps {
  children: ReactNode
  /** Oversized lucide icon watermarked into the top-right corner. */
  watermark?: ReactNode
  /** Vertical rhythm between top-level blocks. */
  gap?: 'none' | 'md' | 'lg'
  className?: string
  contentClassName?: string
}

const GAP_CLASS = {
  none: '',
  md: 'space-y-6',
  lg: 'space-y-8',
} as const

/**
 * Page chrome shared by Guild Hall, Quest Log, Quest Board and Campaign
 * Broadcast: parchment background + noise overlay, 1400px centred column,
 * responsive padding, and the faint corner emblem.
 *
 * Server-safe (no hooks, no framer-motion) so both server pages and client
 * screens can use it.
 */
export function QuestPageShell({
  children,
  watermark,
  gap = 'lg',
  className,
  contentClassName,
}: QuestPageShellProps) {
  return (
    // `overflow-x-clip` (not `hidden`) contains the watermark without turning
    // this into a scroll container, which would break sticky descendants.
    <div className={clsx('relative min-h-[100dvh] w-full max-w-full overflow-x-clip bg-surface select-none', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
        style={{ backgroundImage: PARCHMENT_NOISE, mixBlendMode: 'multiply' }}
      />

      <div className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-[1400px] p-4 font-black md:p-8">
        {watermark ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 -mr-24 -mt-24 hidden opacity-[0.06] md:block"
          >
            {watermark}
          </div>
        ) : null}

        <div className={clsx('relative z-10', GAP_CLASS[gap], contentClassName)}>{children}</div>
      </div>
    </div>
  )
}

export default QuestPageShell
