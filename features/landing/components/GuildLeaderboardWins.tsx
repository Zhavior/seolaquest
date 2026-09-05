import Link from 'next/link'
import { PLAN_CATALOG } from '@/src/modules/billing/domain/catalog'

const questions = [
  {
    question: 'What can I try for free?',
    answer: 'The interactive demo uses sample data and needs no account. A free account lets you save and manage tracked keywords. Manual scans of real conversations require a paid plan and available credits.',
  },
  {
    question: 'Which platforms can I research?',
    answer: 'SEOlaQuest currently supports public conversations on X. Reddit is not enabled for live scans. The demo may include fictional examples from both platforms.',
  },
  {
    question: 'Does a match mean someone will buy?',
    answer: 'A match is a starting point for research. Review the original post, check the context, and talk to potential customers before assuming demand or willingness to pay.',
  },
  {
    question: 'Why use this instead of searching X myself?',
    answer: 'SEOlaQuest brings tracked keywords, scored matches, and source links into a review workflow. The demo lets you see whether that workflow fits how you research customers.',
  },
  {
    question: 'Will every scan find an opportunity?',
    answer: 'No. Results depend on your keywords and the public conversations available from the source. An empty result does not prove there is no demand for your idea.',
  },
]

export default function GuildLeaderboardWins() {
  const beta = PLAN_CATALOG.BETA
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="offer-heading">
      <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Start with the workflow</p>
      <h2 id="offer-heading" className="mt-3 max-w-3xl text-3xl font-black uppercase tracking-tight sm:text-5xl">Try the demo. Research your market when you’re ready.</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="border-4 border-outline bg-card p-6 shadow-brutal">
          <h3 className="text-2xl font-black">Explore for free</h3>
          <p className="mt-4 leading-relaxed text-ink-muted">Try sample conversations without signing up. Create a free account to save your tracked keywords; manual scan credits are not included.</p>
          <Link href="/sign-up" className="mt-6 inline-flex min-h-12 items-center border-2 border-outline px-5 py-3 font-bold shadow-brutal-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">Create free account</Link>
        </article>
        <article className="border-4 border-outline bg-highlight p-6 text-on-accent shadow-brutal">
          <h3 className="text-2xl font-black">Research real conversations</h3>
          <p className="mt-3 text-3xl font-black">{beta.priceLabel}</p>
          <p className="mt-4 leading-relaxed">{beta.name} includes {beta.scanLimit.toLocaleString('en-US')} scan credits per paid billing period. Review the available plans and usage terms before choosing.</p>
          <Link href="/pricing" className="mt-6 inline-flex min-h-12 items-center border-2 border-outline bg-black px-5 py-3 font-bold text-white shadow-brutal-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">Compare plans</Link>
        </article>
      </div>

      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-3xl font-black uppercase tracking-tight">Before you start</h2>
        <div className="mt-6 divide-y-2 divide-outline border-y-2 border-outline">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group py-1">
              <summary className="cursor-pointer py-5 pr-4 text-lg font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink">{question}</summary>
              <p className="pb-6 pr-4 leading-relaxed text-ink-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-20 border-4 border-outline bg-black px-6 py-12 text-center text-white shadow-[8px_8px_0_0_#ff5a36] sm:px-10">
        <h2 className="mx-auto max-w-3xl text-3xl font-black uppercase leading-tight sm:text-5xl">Find the conversation behind your next idea.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">Explore a sample from search to signal review. Decide whether the workflow fits your customer research.</p>
        <Link href="/#demo" className="mt-7 inline-flex min-h-12 items-center justify-center border-4 border-outline bg-accent px-7 py-4 font-black uppercase tracking-wider text-on-accent shadow-[4px_4px_0_0_#ff5a36] transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white">Try the demo</Link>
        <p className="mt-4 text-sm text-white/75">Sample data. No signup needed.</p>
      </div>
    </section>
  )
}
