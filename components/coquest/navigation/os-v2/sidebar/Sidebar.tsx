'use client'

const menu = [
  ['⚔', 'Quest Board'],
  ['🤖', 'AI Guild'],
  ['🏰', 'Campaigns'],
  ['📈', 'Realm Stats'],
  ['💰', 'Treasury'],
  ['👥', 'Guild'],
  ['⚙', 'Arsenal'],
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen flex-col bg-[#F6E8B1]">

      <div className="border-b-[3px] border-black p-6">

        <div className="text-2xl font-black tracking-widest">
          ⚔ COQUEST
        </div>

        <div className="mt-6">

          <div className="text-xs font-black uppercase tracking-widest">
            Apprentice Builder
          </div>

          <div className="mt-3 h-4 overflow-hidden border-[2px] border-black bg-white">
            <div className="h-full w-[72%] bg-[#FFD54F]" />
          </div>

          <div className="mt-2 flex justify-between text-xs font-bold">
            <span>LV 14</span>
            <span>1820 / 2500 XP</span>
          </div>

        </div>

      </div>

      <div className="flex-1 p-4">

        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em]">
          Command Menu
        </div>

        <div className="space-y-2">

          {menu.map(([icon, label], index) => (
            <button
              key={label}
              className={[
                "flex w-full items-center gap-3 border-[2px] border-black px-4 py-3 text-left transition-all duration-200",
                index === 0
                  ? "bg-[#FFF8D6] shadow-[4px_4px_0px_0px_#000]"
                  : "bg-[#F9F1D0] hover:bg-[#FFF8D6]"
              ].join(" ")}
            >
              <span className="text-lg">{icon}</span>

              <span className="font-black">
                {label}
              </span>
            </button>
          ))}

        </div>

      </div>

      <div className="border-t-[3px] border-black p-4">

        <div className="text-xs font-black">
          Boyd
        </div>

        <div className="mt-1 text-xs opacity-70">
          Save Progress
        </div>

      </div>

    </aside>
  )
}
