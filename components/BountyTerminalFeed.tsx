import { Radio, Terminal } from 'lucide-react'

export default function BountyTerminalFeed() {
  return (
    <section className="relative my-6 overflow-hidden border-4 border-black bg-black font-mono text-[#A3E635] shadow-[8px_8px_0_0_#000]">
      <header className="flex items-center justify-between border-b-4 border-black bg-[#111] p-3 text-xs font-black uppercase tracking-widest text-[#FFE600]">
        <span className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Provider activity</span>
        <span className="bg-white px-2 py-0.5 text-[10px] text-black">No live telemetry</span>
      </header>
      <div className="flex min-h-32 items-center gap-3 p-5 text-sm font-bold">
        <Radio className="h-5 w-5 text-zinc-500" />
        <p>No verified provider events are available for this view. Results appear only after a backend scan stores them.</p>
      </div>
    </section>
  )
}
