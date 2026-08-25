import Link from 'next/link'

export function LandingNavClient() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 shrink-0 items-center px-2 text-xs font-bold uppercase tracking-wider underline-offset-4 decoration-4 hover:underline focus-visible:underline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
      >
        Sign in
      </Link>

      <Link
        href="/sign-up"
        className="inline-flex min-h-11 shrink-0 items-center border-[3px] border-outline bg-accent-2 px-3 py-2 font-black uppercase tracking-[0.14em] text-on-accent shadow-brutal-sm transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:text-sm"
      >
        Start free
      </Link>
    </div>
  )
}
