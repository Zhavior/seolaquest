import { Database, FlaskConical, Search, ShieldCheck } from 'lucide-react'

const WORKFLOW = [
  {
    icon: Search,
    title: '1. Configure keywords',
    body: 'Store phrases that a configured provider may search for.',
  },
  {
    icon: Database,
    title: '2. Start a manual scan',
    body: 'Your request is accepted or rejected according to entitlement and available credits.',
  },
  {
    icon: ShieldCheck,
    title: '3. Review stored matches',
    body: 'A source match is a record to review, not verified intent, revenue, or an automatic reply.',
  },
]

export default function ManaEngineDemo() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <div className="mb-4 inline-flex -rotate-1 items-center gap-2 border-4 border-black bg-[#4169e1] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <FlaskConical size={16} /> Interface workflow
        </div>
        <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl md:text-7xl">
          How the <span className="text-[#4169e1] underline decoration-[#ffd700] decoration-wavy">Mana metaphor</span> maps to work
        </h2>
        <p className="mt-5 font-bold text-gray-800">
          This is a product explanation, not a live scan, customer result, generated lead, or working automation demo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {WORKFLOW.map(({ icon: Icon, title, body }) => (
          <article key={title} className="border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <Icon className="h-8 w-8 text-[#FF5722]" />
            <h3 className="mt-4 text-xl font-black uppercase">{title}</h3>
            <p className="mt-3 font-bold leading-relaxed text-gray-700">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
