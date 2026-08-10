import type { ReactNode } from 'react'

type MissionControlShellProps = {
  /** Compact page chrome / context */
  chrome: ReactNode
  /** Dominant Today's Mission */
  mission: ReactNode
  /** Optional urgent lead strip */
  urgent?: ReactNode
  /** Campaign pulse */
  pulse: ReactNode
  /** Keywords, feed, radar, etc. */
  operations: ReactNode
  /** Progress / leaderboard / secondary stats */
  strategy?: ReactNode
}

/**
 * First-viewport-first layout for Mission Control.
 * Mobile source order matches decision priority; desktop keeps the same stack
 * with wider rhythm rather than equal-weight bento cards.
 */
export default function MissionControlShell({
  chrome,
  mission,
  urgent,
  pulse,
  operations,
  strategy,
}: MissionControlShellProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {chrome}
      {mission}
      {urgent}
      {pulse}
      {operations}
      {strategy}
    </div>
  )
}
