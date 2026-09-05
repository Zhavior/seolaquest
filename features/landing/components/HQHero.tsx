import Link from 'next/link'

const ROOMS = [
  { icon: '🏛', name: 'Guild Hall', desc: 'Live dashboard' },
  { icon: '📜', name: 'Quest Board', desc: 'Tracked keywords' },
  { icon: '⚔', name: 'War Room', desc: 'Lead inbox' },
  { icon: '🔮', name: 'Mage Tower', desc: 'AI agents' },
  { icon: '💰', name: 'Treasury', desc: 'Mana & billing' },
  { icon: '📖', name: 'Archive', desc: 'Scan history' },
]

const STATS = [
  { value: '2.4M+', label: 'Posts Scanned' },
  { value: '180+', label: 'Guild Masters' },
  { value: '94%', label: 'Signal Accuracy' },
]

export function HQHero() {
  return (
    <section
      className="relative overflow-hidden pt-28 sm:pt-36 pb-20 sm:pb-28 px-4 sm:px-6"
      aria-labelledby="hero-heading"
    >
      {/* Parchment grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Live badge */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <span
            className="inline-flex items-center gap-2 border-3 border-outline px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] shadow-brutal"
            style={{ background: '#FFE600' }}
          >
            <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" aria-hidden="true" />
            Guild Open — Free Tier Available
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">

            {/* Plain-English purpose strip — crawlable, scannable */}
            <p className="mb-5 text-sm sm:text-base font-black uppercase tracking-[0.16em] text-ink-muted text-center lg:text-left">
              AI-powered social listening for SaaS founders
            </p>

            <h1
              id="hero-heading"
              className="font-black uppercase leading-[0.9] tracking-tighter text-ink"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            >
              Find customers<br />
              <span
                className="relative inline-block"
                style={{ color: '#ff4500' }}
              >
                mentioning you.
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  style={{ height: '6px' }}
                  viewBox="0 0 100 6"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 3 Q25 6 50 3 Q75 0 100 3" stroke="black" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </h1>

            {/* One-sentence value prop — unambiguous for Google & first-time visitors */}
            <p className="mt-6 text-lg sm:text-xl font-bold leading-snug max-w-xl mx-auto lg:mx-0 text-ink/80">
              SEOlaQuest monitors X (Twitter) and Reddit for your target keywords in real time, flags posts where potential customers are asking for a solution you sell, and delivers those leads to your inbox — automatically.
            </p>

            {/* Theme flavor, now secondary */}
            <div
              className="mt-6 border-4 border-outline p-4 font-bold text-sm sm:text-base shadow-brutal-lg max-w-xl mx-auto lg:mx-0 -rotate-[0.5deg]"
              style={{ background: '#ffd700' }}
            >
              ⚔ Track keywords → AI scouts every matching post → you reply first, every time.
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 border-4 border-outline font-black uppercase tracking-widest text-lg sm:text-xl text-ink shadow-brutal-lg hover:translate-x-[-3px] hover:translate-y-[-3px] active:translate-x-0 active:translate-y-0 transition-transform"
                style={{ background: '#ff4500' }}
              >
                ⚔ Start Monitoring Free
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 border-4 border-outline font-black uppercase tracking-widest text-lg sm:text-xl bg-card shadow-brutal-lg hover:translate-x-[-3px] hover:translate-y-[-3px] active:translate-x-0 active:translate-y-0 transition-transform"
              >
                See How It Works →
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-black">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: HQ map card */}
          <aside
            aria-label="Headquarters room map"
            className="border-4 border-outline shadow-brutal-lg overflow-hidden"
            style={{ background: '#f4ebd8' }}
          >
            <div
              className="border-b-4 border-outline px-5 py-3 flex items-center gap-2"
              style={{ background: '#FFE600' }}
            >
              <span className="font-black uppercase tracking-widest text-sm">🏰 HQ Rooms</span>
            </div>
            <div className="grid grid-cols-2 divide-x-4 divide-y-4 divide-black border-b-0">
              {ROOMS.map(({ icon, name, desc }) => (
                <div
                  key={name}
                  className="flex flex-col items-center justify-center gap-1 px-4 py-5 text-center border-outline hover:bg-black hover:text-white transition-colors cursor-default group"
                >
                  <span className="text-2xl" aria-hidden="true">{icon}</span>
                  <span className="font-black uppercase tracking-wide text-xs">{name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted group-hover:text-white/60">{desc}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t-4 border-outline text-center">
              <span className="text-xs font-black uppercase tracking-widest text-ink-muted">
                One Persistent Headquarters
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
