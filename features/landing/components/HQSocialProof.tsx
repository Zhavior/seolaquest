const GUILD_ROSTER = [
  { rank: 1, name: 'raidmaster_00',  class: 'Archmage',    leads: 847, badge: '🥇' },
  { rank: 2, name: 'huntress_x',     class: 'Ranger',      leads: 723, badge: '🥈' },
  { rank: 3, name: 'byte_paladin',   class: 'Paladin',     leads: 601, badge: '🥉' },
  { rank: 4, name: 'founder_grind',  class: 'Warrior',     leads: 489, badge: '⚔' },
  { rank: 5, name: 'solo_rogue',     class: 'Rogue',       leads: 412, badge: '🗡' },
]

const TESTIMONIALS = [
  {
    quote: 'The War Room inbox replaced 3 hours of manual Reddit scanning per day.',
    author: 'SaaS founder, AppSumo launch',
    class: 'Archmage',
  },
  {
    quote: 'The neobrutalist UI is the most memorable dashboard I\'ve used. I actually want to open it.',
    author: 'Growth operator, Series A startup',
    class: 'Ranger',
  },
  {
    quote: 'Mana-based billing makes sense. I run big scans on launch day, idle the rest of the month.',
    author: 'Indie hacker, 3 SaaS products',
    class: 'Rogue',
  },
]

export function HQSocialProof() {
  return (
    <section
      id="leaderboard"
      className="px-4 sm:px-6 py-20 sm:py-28 border-t-4 border-black"
      aria-labelledby="proof-heading"
    >
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[1fr_420px] gap-12">

        {/* Leaderboard */}
        <div>
          <span
            className="mb-4 inline-block border-3 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_#000]"
            style={{ background: '#FFE600' }}
          >
            Guild Rankings
          </span>
          <h2
            id="proof-heading"
            className="mb-6 text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none"
          >
            Top Guild Masters<br />This Season
          </h2>

          <div className="border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
            <table className="w-full" role="table" aria-label="Guild leaderboard">
              <thead>
                <tr className="border-b-4 border-black" style={{ background: '#FFE600' }}>
                  {['#', 'Guild Master', 'Class', 'Leads'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GUILD_ROSTER.map(({ name, class: cls, leads, badge }, i) => (
                  <tr
                    key={name}
                    className="border-b-2 border-black last:border-b-0 hover:bg-black hover:text-white transition-colors group"
                    style={{ background: i % 2 === 0 ? '#f4ebd8' : 'white' }}
                  >
                    <td className="px-4 py-3 font-black text-sm">{badge}</td>
                    <td className="px-4 py-3 font-black text-sm uppercase tracking-wider">{name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-black/50 group-hover:text-white/60">{cls}</td>
                    <td className="px-4 py-3 font-black text-sm tabular-nums">{leads.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="flex flex-col gap-5">
          <div className="mb-2">
            <span
              className="mb-4 inline-block border-3 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_#000]"
              style={{ background: '#FFE600' }}
            >
              Field Reports
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
              From the Field
            </h2>
          </div>
          {TESTIMONIALS.map(({ quote, author, class: cls }) => (
            <blockquote
              key={author}
              className="border-4 border-black p-5 shadow-[5px_5px_0_0_#000]"
              style={{ background: '#f4ebd8' }}
            >
              <p className="font-bold text-sm sm:text-base leading-relaxed mb-3">&ldquo;{quote}&rdquo;</p>
              <footer className="flex items-center gap-2">
                <span
                  className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ background: '#FFE600' }}
                >
                  {cls}
                </span>
                <cite className="text-xs font-bold text-black/50 not-italic">{author}</cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
