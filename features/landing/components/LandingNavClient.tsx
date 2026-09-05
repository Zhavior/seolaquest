import Link from 'next/link'

export function LandingNavClient() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-medium tracking-wide underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
      >
        Sign in
      </Link>

      <Link
        href="/#demo"
        className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-outline bg-accent-2 px-3 py-2 font-semibold text-on-accent transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:text-sm"
      >
        Try the demo
      </Link>
    </div>
  )
}
