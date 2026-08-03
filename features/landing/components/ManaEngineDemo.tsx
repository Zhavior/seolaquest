import { ArrowRight, Database, FlaskConical, Search, ShieldCheck } from 'lucide-react'

const WORKFLOW = [
  {
    icon: Search,
    stage: 'Stage 01: Preparation',
    title: 'Configure keywords',
    body: 'Choose the phrases, demand signals, and search angles your guild wants to track first.',
  },
  {
    icon: Database,
    stage: 'Stage 02: Cast Scan',
    title: 'Start a manual scan',
    body: 'Spend credits intentionally, trigger a scan, and surface candidate conversations worth reviewing.',
  },
  {
    icon: ShieldCheck,
    stage: 'Stage 03: Loot Inventory',
    title: 'Review stored matches',
    body: 'Inspect source matches as evidence to review, not instant intent, revenue, or automated outreach.',
  },
]

export default function ManaEngineDemo() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto mb-12 max-w-4xl text-center">
        <div className="mb-4 inline-flex -rotate-1 items-center gap-2 border-4 border-black bg-[#4169e1] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <FlaskConical size={16} /> Interface workflow
        </div>

        <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl md:text-7xl">
          How the <span className="text-[#4169e1] underline decoration-[#ffd700] decoration-wavy">Mana metaphor</span> maps to work
        </h2>

        <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 border-4 border-black bg-[#fff1bf] p-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-black shadow-[4px_4px_0_0_#000] sm:text-xs">
          <span className="shrink-0 border-2 border-black bg-[#FFE600] px-2 py-1 font-black">
            SYSTEM NOTICE
          </span>
          <span>Demo mode active // Product boundaries shown explicitly without sales hype.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {WORKFLOW.map(({ icon: Icon, stage, title, body }, index) => (
          <div key={title} className="relative">
            {index < WORKFLOW.length - 1 ? (
              <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 md:flex items-center text-black">
                <div className="h-0 w-10 border-t-4 border-dashed border-black" />
                <ArrowRight className="h-5 w-5 -translate-y-px" />
              </div>
            ) : null}

            <article className="relative flex h-full flex-col border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
              <div className="inline-flex w-fit items-center border-2 border-black bg-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] sm:text-[11px]">
                {stage}
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="shrink-0 border-2 border-black bg-[#FFE600] p-2 shadow-[2px_2px_0_0_#000]">
                  <Icon className="h-6 w-6 text-black" />
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase text-black">{title}</h3>
                  <p className="mt-3 font-bold leading-relaxed text-gray-700">{body}</p>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
