'use client'

export default function StatusBar() {
  return (
    <div className="flex h-20 items-center justify-between border-b-[3px] border-black bg-[#FFF8D6] px-6">

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em]">
          Main Quest
        </p>

        <h2 className="mt-1 text-lg font-black">
          Launch Public Beta
        </h2>

        <div className="mt-2 h-3 w-72 overflow-hidden border-2 border-black bg-white">
          <div className="h-full w-[73%] bg-[#FFD54F]" />
        </div>
      </div>

      <div className="flex items-center gap-8">

        <div className="text-center">
          <div className="text-xl">🤖</div>
          <div className="text-xs font-black">4</div>
        </div>

        <div className="text-center">
          <div className="text-xl">📈</div>
          <div className="text-xs font-black">18%</div>
        </div>

        <div className="text-center">
          <div className="text-xl">💰</div>
          <div className="text-xs font-black">$2.9K</div>
        </div>

        <div className="text-center">
          <div className="text-xl">🔔</div>
          <div className="text-xs font-black">3</div>
        </div>

      </div>

    </div>
  )
}
