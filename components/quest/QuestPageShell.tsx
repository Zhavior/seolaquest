import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface QuestPageShellProps {
  children: ReactNode
  /**
   * Accepted for older call sites and not drawn: the dusk scene behind the
   * shell replaced the oversized corner emblem.
   */
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
 * Broadcast: a 1400px centred column with responsive padding. It is
 * transparent on purpose — the dusk sky and ridge belong to the shell
 * (`.dq-world`), so every page sits in the same scene. The bottom padding
 * keeps the last panel clear of the ridge.
 *
 * Server-safe (no hooks, no framer-motion) so both server pages and client
 * screens can use it.
 */
export function QuestPageShell({
  children,
  gap = 'lg',
  className,
  contentClassName,
}: QuestPageShellProps) {
  return (
    // `overflow-x-clip` (not `hidden`) contains wide children without turning
    // this into a scroll container, which would break sticky descendants.
    <div className={clsx('relative w-full max-w-full overflow-x-clip', className)}>
      <div className="relative z-10 mx-auto w-full max-w-[1400px] p-3 pb-24 font-normal sm:p-5 sm:pb-28 md:p-8 md:pb-32">
        <div className={clsx('relative z-10', GAP_CLASS[gap], contentClassName)}>{children}</div>
      </div>
    </div>
  )
}

export default QuestPageShell
