const FEATURES = [
  {
    icon: '📜',
    room: 'Quest Board',
    headline: 'Track keywords like active bounties',
    body: 'Every keyword you monitor becomes a tracked quest. Set triggers, choose platforms, define intent signals.',
    tag: 'TRACKING',
  },
  {
    icon: '🤖',
    room: 'Mage Tower',
    headline: 'AI agents that actually do the work',
    body: 'Your adventurers patrol Reddit, X, and web forums — classifying, scoring, and filtering in real time.',
    tag: 'AI AGENTS',
  },
  {
    icon: '⚔',
    room: 'War Room',
    headline: 'Leads land in your command center',
    body: 'Every matched post arrives formatted, scored, and ready to act on. One inbox. No noise.',
    tag: 'LEADS',
  },
  {
    icon: '💧',
    room: 'Treasury',
    headline: 'Mana powers every scan',
    body: 'Buy mana potions, upgrade your class, and run deeper scans. Pay for what you actually use.',
    tag: 'BILLING',
  },
  {
    icon: '📖',
    room: 'Archive',
    headline: 'Full run history preserved',
    body: 'Every scan logged. Every match timestamped. Audit your guild\'s performance anytime.',
    tag: 'HISTORY',
  },
  {
    icon: '🏛',
    room: 'Guild Hall',
    headline: 'Live dashboard, one glance',
    body: 'Mana balance, active quests, recent leads, guild rank — everything visible the moment you walk in.',
    tag: 'DASHBOARD',
  },
]

export function HQFeatures() {
  return (
    <section
      id="features"
      className="px-4 sm:px-6 py-20 sm:py-28 border-t-4 border-black"
      aria-labelledby="features-heading"
      style={{ background: '#f4ebd8' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span
              className="mb-3 inline-block border-3 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_#000]"
              style={{ background: '#FFE600' }}
            >
              The Six Rooms
            </span>
            <h2
              id="features-heading"
              className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none"
            >
              One HQ.<br />Six Rooms.
            </h2>
          </div>
          <p className="max-w-sm text-sm font-bold leading-relaxed text-black/60 sm:text-right">
            Every room serves a specific operational purpose.
            Navigate the HQ strip to move between them.
          </p>
        </div>

        {/* Feature grid — asymmetric 2+1+2+1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t-4 border-l-4 border-black">
          {FEATURES.map(({ icon, room, headline, body, tag }, i) => (
            <article
              key={room}
              className="border-b-4 border-r-4 border-black p-6 sm:p-8 flex flex-col gap-3 hover:bg-black hover:text-white transition-colors group"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl" aria-hidden="true">{icon}</span>
                <span
                  className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest group-hover:border-white"
                  style={{ background: i === 0 ? '#FFE600' : 'transparent' }}
                >
                  {tag}
                </span>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-black/40 group-hover:text-white/50 mb-1">
                  {room}
                </div>
                <h3 className="text-lg font-black uppercase leading-snug tracking-tight">{headline}</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-black/70 group-hover:text-white/80">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
