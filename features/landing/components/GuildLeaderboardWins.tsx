import Link from 'next/link'
import { LockKeyhole, ShieldCheck, Trophy } from 'lucide-react'

const EVIDENCE_STATUS = [
  {
    title: 'Customer outcomes',
    status: 'Locked // Evidence in progress',
    detail: 'SEOlaQuest does not yet have verified customer case studies to display.',
    progressLabel: 'Verified case studies',
    progressValue: '0 / 5 unlocked',
    progressPercent: '0%',
  },
  {
    title: 'Performance benchmarks',
    status: 'Locked // Evidence in progress',
    detail: 'Revenue, conversion, and response-time claims require real production evidence.',
    progressLabel: 'Benchmarks published',
    progressValue: '0 / 3 unlocked',
    progressPercent: '0%',
  },
  {
    title: 'Public leaderboard',
    status: 'Locked // Privacy rules pending',
    detail: 'Tenant activity stays private until an explicit public opt-in model is shipped.',
    progressLabel: 'Public modes released',
    progressValue: '0 / 1 unlocked',
    progressPercent: '0%',
  },
]

export default function GuildLeaderboardWins() {
  return (
    <section className="relative z-10 mx-auto my-12 max-w-7xl px-4 pb-8 sm:px-6" aria-labelledby="evidence-heading">
      <div className="mb-8 flex items-start gap-3">
        <div className="border-3 border-outline bg-highlight p-2 shadow-brutal-sm">
          <Trophy size={28} className="text-on-accent" />
        </div>

        <div>
          <h2 id="evidence-heading" className="text-3xl font-black uppercase text-ink sm:text-4xl">
            Evidence before big claims
          </h2>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-muted">
            Current public proof status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {EVIDENCE_STATUS.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col justify-between border-4 border-outline bg-card p-6 shadow-brutal"
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-outline bg-accent p-2 shadow-brutal-sm">
                  <ShieldCheck className="h-5 w-5 text-on-accent" />
                </div>
                <h3 className="text-lg font-black uppercase text-ink">{item.title}</h3>
              </div>

              <p className="font-bold leading-relaxed text-ink-muted">{item.detail}</p>

              <div className="mt-5 border-3 border-outline bg-[#f7f1e8] p-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-on-accent sm:text-[11px]">
                  <span>{item.progressLabel}</span>
                  <span>{item.progressValue}</span>
                </div>
                <div className="mt-2 h-4 border-2 border-outline bg-card">
                  <div className="h-full w-0 bg-accent" style={{ width: item.progressPercent }} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 border-t-2 border-outline pt-3 text-xs font-black uppercase tracking-[0.12em] text-ink">
              <LockKeyhole className="h-4 w-4" />
              {item.status}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 border-4 border-outline bg-black px-6 py-10 text-center text-white shadow-[8px_8px_0_0_#ff5a36] sm:px-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFE600]">Start researching</p>
        <h3 className="mt-4 text-3xl font-black uppercase leading-none sm:text-5xl">
          Ready to review your first signal?
        </h3>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold text-white/85 sm:text-lg">
          Get 50 free scan credits. No credit card required.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center border-4 border-outline bg-accent px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-on-accent shadow-[6px_6px_0_0_#ff5a36] transition-transform duration-150 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#ff5a36] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-10 sm:text-xl"
          >
            Start your first scan
          </Link>
        </div>
      </div>
    </section>
  )
}
