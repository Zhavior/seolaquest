import { CheckCircle2, ShieldCheck, Trophy } from 'lucide-react'

const EVIDENCE_STATUS = [
  {
    title: 'Customer outcomes',
    status: 'Not published',
    detail: 'CoQuest does not yet have verified customer case studies to display.',
  },
  {
    title: 'Performance benchmarks',
    status: 'Not measured',
    detail: 'Revenue, conversion, and response-time claims require real production evidence.',
  },
  {
    title: 'Public leaderboard',
    status: 'Disabled',
    detail: 'Tenant activity stays private until an explicit public opt-in model is shipped.',
  },
]

export default function GuildLeaderboardWins() {
  return (
    <section className="my-12 w-full" aria-labelledby="evidence-heading">
      <div className="mb-6 flex items-center gap-3">
        <Trophy size={32} className="text-[#FF5722]" />
        <div>
          <h2 id="evidence-heading" className="text-3xl font-black uppercase text-black">Evidence before victory laps</h2>
          <p className="text-xs font-bold uppercase text-gray-600">Current public proof status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {EVIDENCE_STATUS.map((item) => (
          <article key={item.title} className="flex flex-col justify-between border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#06B6D4]" />
                <h3 className="text-lg font-black uppercase text-black">{item.title}</h3>
              </div>
              <p className="font-bold leading-relaxed text-gray-700">{item.detail}</p>
            </div>
            <div className="mt-6 flex items-center gap-2 border-t-2 border-black pt-3 text-xs font-black uppercase text-black">
              <CheckCircle2 className="h-4 w-4" /> {item.status}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
