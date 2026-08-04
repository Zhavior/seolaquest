'use client'

export default function Sidebar() {
  return (
    <aside className="flex h-screen flex-col border-r-[3px] border-black bg-[#F8E7A8]">
      <div className="border-b-[3px] border-black p-6">
        <h1 className="text-xl font-black uppercase tracking-widest">
          ⚔ COQUEST
        </h1>

        <div className="mt-6">
          <div className="text-xs font-black uppercase">
            Level 14
          </div>

          <div className="mt-2 h-4 overflow-hidden border-2 border-black bg-white">
            <div className="h-full w-3/4 bg-[#FFD54F]" />
          </div>

          <div className="mt-2 text-xs font-bold">
            XP 1,820 / 2,500
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        <button className="w-full border-2 border-black bg-[#FFF8D6] px-4 py-3 text-left font-black">
          ⚔ Quest Board
        </button>

        <button className="w-full border-2 border-black px-4 py-3 text-left">
          🤖 AI Guild
        </button>

        <button className="w-full border-2 border-black px-4 py-3 text-left">
          📈 Realm Stats
        </button>

        <button className="w-full border-2 border-black px-4 py-3 text-left">
          💰 Treasury
        </button>

        <button className="w-full border-2 border-black px-4 py-3 text-left">
          ⚙ Arsenal
        </button>
      </nav>
    </aside>
  )
}
