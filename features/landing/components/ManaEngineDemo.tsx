import { ArrowRight, Database, FlaskConical, Search, ShieldCheck } from 'lucide-react'

const WORKFLOW = [
  {
    icon: Search,
    stage: 'Stage 01: Define',
    title: 'Tune the signal lens',
    body: 'Choose the exact phrases, demand signals, and search angles that matter now.',
  },
  {
    icon: Database,
    stage: 'Stage 02: Stream',
    title: 'Watch matches arrive',
    body: 'Signals appear as a live feed, so the interface feels active instead of batch-processed.',
  },
  {
    icon: ShieldCheck,
    stage: 'Stage 03: Inspect',
    title: 'Open the evidence panel',
    body: 'Review source matches, confidence notes, and thread context before you move forward.',
  },
]

export default function ManaEngineDemo() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto mb-12 max-w-4xl text-center">
        <div className="mb-4 inline-flex -rotate-1 items-center gap-2 border-4 border-outline bg-[#4169e1] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-brutal">
          <FlaskConical size={16} /> Live signal workflow
        </div>

        <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-ink sm:text-5xl md:text-7xl">
          Signals stream into decisions
        </h2>

        <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 border-4 border-outline bg-[#fff1bf] p-3 text-left font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-accent shadow-brutal sm:text-xs">
          <span className="shrink-0 border-2 border-outline bg-accent px-2 py-1 font-black">
            LIVE MODE
          </span>
          <span>Streaming preview active // updates pulse in real time inside the demo console.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {WORKFLOW.map(({ icon: Icon, stage, title, body }, index) => (
          <div key={title} className="relative">
            {index < WORKFLOW.length - 1 ? (
              <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 md:flex items-center text-ink">
                <div className="h-0 w-10 border-t-4 border-dashed border-outline" />
                <ArrowRight className="h-5 w-5 -translate-y-px" />
              </div>
            ) : null}

            <article className="relative flex h-full flex-col border-4 border-outline bg-card p-6 shadow-brutal-lg">
              <div className="inline-flex w-fit items-center border-2 border-outline bg-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600] sm:text-[11px]">
                {stage}
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="shrink-0 border-2 border-outline bg-accent p-2 shadow-brutal-sm">
                  <Icon className="h-6 w-6 text-on-accent" />
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase text-ink">{title}</h3>
                  <p className="mt-3 font-bold leading-relaxed text-ink-muted">{body}</p>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
