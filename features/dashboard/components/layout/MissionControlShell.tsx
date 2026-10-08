import type { ReactNode } from 'react'

type MissionControlShellProps = {
  /** Compact page chrome / context */
  chrome: ReactNode
  /** The lead list and scan control, under the next step */
  opportunities?: ReactNode
  /** Dominant Today's Mission */
  mission: ReactNode
  /** Optional urgent lead strip */
  urgent?: ReactNode
  /** Campaign pulse */
  pulse: ReactNode
  /** Keywords, radar, etc. */
  operations: ReactNode
  /** Progress / leaderboard / secondary stats */
  strategy?: ReactNode
}

/**
 * First-viewport-first layout for Mission Control: the valley header, then the
 * one next step, then the lead list and supporting panels. The next step comes
 * before the list so a new user sees what to do without scrolling past it.
 * Mobile source order matches decision priority; desktop keeps the same stack
 * with wider rhythm rather than equal-weight bento cards.
 */
export default function MissionControlShell({
  chrome,
  opportunities,
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
      {opportunities}
      {urgent}
      {pulse}
      {operations}
      {strategy}
    </div>
  )
}
