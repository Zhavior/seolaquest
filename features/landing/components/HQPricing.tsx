import Link from 'next/link'

const TIERS = [
  {
    name: 'Apprentice',
    price: 'Free',
    sub: 'forever',
    mana: '200 mana / mo',
    color: 'bg-white',
    accent: '#000',
    features: [
      '3 tracked keywords',
      '1 AI adventurer',
      'Reddit scanning',
      'War Room (read-only export)',
      'Archive (7 days)',
    ],
    cta: 'Start Free',
    href: '/sign-up',
    featured: false,
  },
  {
    name: 'Capper',
    price: '$29',
    sub: '/ month',
    mana: '2,000 mana / mo',
    color: '',
    accent: '#ff4500',
    features: [
      '25 tracked keywords',
      '5 AI adventurers',
      'Reddit + X + Web',
      'War Room (full CRM)',
      'Archive (90 days)',
      'Mana top-up marketplace',
      'Custom intent classifiers',
    ],
    cta: 'Claim Capper Rank',
    href: '/sign-up?tier=capper',
    featured: true,
  },
  {
    name: 'Archmage',
    price: '$99',
    sub: '/ month',
    mana: 'Unlimited mana',
    color: 'bg-black text-white',
    accent: '#FFE600',
    features: [
      'Unlimited keywords',
      'Unlimited adventurers',
      'All platforms + API access',
      'Full CRM + webhook delivery',
      'Archive (unlimited)',
      'White-label export',
      'Priority scan queue',
    ],
    cta: 'Ascend to Archmage',
    href: '/sign-up?tier=archmage',
    featured: false,
  },
]

export function HQPricing() {
  return (
    <section
      className="px-4 sm:px-6 py-20 sm:py-28 border-t-4 border-black"
      aria-labelledby="pricing-heading"
      style={{ background: '#f4ebd8' }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span
            className="mb-4 inline-block border-3 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] shadow-[3px_3px_0_0_#000]"
            style={{ background: '#FFE600' }}
          >
            Treasury
          </span>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none"
          >
            Choose Your Guild Rank
          </h2>
          <p className="mt-3 text-sm font-bold text-black/50 uppercase tracking-widest">
            Mana powers every scan. Buy more anytime.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-0 border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
          {TIERS.map(({ name, price, sub, mana, color, accent, features, cta, href, featured }, i) => (
            <div
              key={name}
              className={`flex flex-col ${color} ${i < 2 ? 'sm:border-r-4 sm:border-black' : ''} ${featured ? '' : ''} relative`}
              style={featured ? { background: '#f4ebd8' } : {}}
            >
              {featured && (
                <div
                  className="absolute inset-x-0 top-0 border-b-4 border-black text-center py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ background: '#ff4500' }}
                >
                  Most Popular
                </div>
              )}
              <div className={`p-6 sm:p-8 border-b-4 border-black flex flex-col gap-1 ${featured ? 'pt-10' : ''}`}>
                <span className="text-xs font-black uppercase tracking-widest text-black/40">{name}</span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{price}</span>
                  <span className="text-sm font-bold text-black/50 mb-1">{sub}</span>
                </div>
                <span
                  className="inline-block self-start border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mt-1"
                  style={{ background: accent, color: accent === '#000' ? 'white' : 'black' }}
                >
                  {mana}
                </span>
              </div>

              <ul className="flex-1 flex flex-col gap-3 p-6 sm:p-8" role="list">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-bold">
                    <span aria-hidden="true" className="shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="p-6 sm:p-8 pt-0">
                <Link
                  href={href}
                  className="flex w-full items-center justify-center border-4 border-black py-3.5 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 transition-transform"
                  style={{
                    background: accent,
                    color: accent === '#000' ? 'white' : accent === '#FFE600' ? 'black' : 'black',
                  }}
                >
                  {cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-bold text-black/40 uppercase tracking-widest">
          All plans include 14-day money-back guarantee · No hidden mana fees
        </p>
      </div>
    </section>
  )
}
