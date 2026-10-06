import Link from 'next/link'

type Props = {
  remaining: number
  max: number
  /** The plan label the server built, e.g. "BETA / active" or "NO ACTIVE PLAN". */
  plan: string
  canUsePaidScans: boolean
}

/**
 * Credits and plan, pinned to the bottom of the dashboard so they stay in view
 * while working the lead list. On phones it sits above the shell's bottom tray
 * and drops the word "remaining" to stay on one row.
 * The link only says "upgrade" when the account cannot run paid scans; the
 * billing page decides what is actually on offer.
 */
export function DashboardQuotaDock({ remaining, max, plan, canUsePaidScans }: Props) {
  return (
    <div
      role="region"
      aria-label="Credits and plan"
      className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+var(--mobile-tray-height,0px))] z-30 mt-6 rounded-t-[14px] border border-b-0 border-[#5a4720] bg-[rgb(13_10_28/0.94)] px-3 py-2.5 text-[#f6ebd2] backdrop-blur-md sm:px-5 sm:py-3 md:bottom-0"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <div className="min-w-0">
            <span className="block font-mono text-[10px] tracking-wider text-[#a99fc9]">CREDITS</span>
            <span className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-[#5dd6b0]">
              {remaining} / {max}
              <span className="hidden sm:inline"> remaining</span>
            </span>
          </div>
          <div aria-hidden="true" className="h-7 w-px bg-[#5a4720]" />
          <div className="min-w-0">
            <span className="block font-mono text-[10px] tracking-wider text-[#a99fc9]">CURRENT PLAN</span>
            <span className="block max-w-[9rem] truncate font-mono text-sm sm:max-w-[16rem]">{plan}</span>
          </div>
        </div>

        <Link
          href="/app/billing"
          className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] border border-[#8a6420] bg-[linear-gradient(#f3d58a,#d8a93b)] px-3 text-xs sm:px-4 font-bold uppercase tracking-wider text-[#1a1206] transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3d58a]"
        >
          {canUsePaidScans ? 'Billing' : 'See plans'}
        </Link>
      </div>
    </div>
  )
}
