import { Database, FlaskConical, Search, ShieldCheck } from 'lucide-react'

const WORKFLOW = [
  {
    icon: Search,
    stage: 'Stage 01: Define',
    title: 'Choose a customer problem',
    body: 'Add keywords for a customer problem, competitor, or request for an alternative.',
  },
  {
    icon: Database,
    stage: 'Stage 02: Research',
    title: 'Find relevant conversations',
    body: 'Scan X for conversations about your problem and review the matches in one place.',
  },
  {
    icon: ShieldCheck,
    stage: 'Stage 03: Inspect',
    title: 'Review before you act',
    body: 'Open the original post, check the context, and decide whether to investigate or respond.',
  },
]

export default function ManaEngineDemo() {
  return (
    <section id="how-it-works" className="scroll-mt-24 relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto mb-12 max-w-4xl text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-[20px] border border-outline bg-forest px-4 py-1.5 text-xs font-semibold tracking-wide text-on-forest">
          <FlaskConical size={16} /> From question to evidence
        </div>

        <h2 className="font-display text-3xl font-medium leading-none tracking-tight text-ink sm:text-5xl">
          Turn a search into a better conversation
        </h2>

      <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 rounded-[20px] border border-outline bg-highlight p-3 text-left font-sans text-[11px] font-medium text-on-accent sm:text-xs">
          <span className="shrink-0 rounded-xl border border-outline bg-accent px-2 py-1 font-semibold">
            How it works
          </span>
          <span>Define your question. Review the sources. Choose your next validation step.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {WORKFLOW.map(({ icon: Icon, stage, title, body }) => (
          <div key={title} className="relative">

            <article className="relative flex h-full flex-col rounded-[20px] border border-outline bg-card p-6">
      <div className="inline-flex w-fit items-center rounded-[20px] border border-outline bg-forest px-2 py-1 text-[10px] font-semibold text-accent sm:text-[11px]">
                {stage}
              </div>

      <div className="mt-5 flex items-start gap-4">
      <div className="shrink-0 rounded-xl border border-outline bg-accent p-2">
                  <Icon className="h-6 w-6 text-on-accent" />
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-ink">{title}</h3>
                  <p className="mt-3 font-medium leading-relaxed text-ink-muted">{body}</p>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
