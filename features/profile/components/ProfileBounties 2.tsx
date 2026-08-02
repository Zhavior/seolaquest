export function ProfileBounties() {
  return (
    <div className="bg-black text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
      <h3 className="text-xl font-black uppercase text-yellow-400 flex items-center gap-2">
        🔥 LIVE BOUNTIES
      </h3>

      <div className="space-y-3">
        <div className="bg-slate-900 border-2 border-yellow-400 p-3.5 flex justify-between items-center">
          <div>
            <div className="text-xs font-black text-yellow-400 uppercase">RAID: LAUNCH PRO V2</div>
            <div className="text-xs text-slate-300">Revenue targets are not tracked in CoQuest.</div>
          </div>
          <div className="bg-red-500 text-white font-black text-xs px-2 py-1 border border-white animate-pulse">
            3 DAYS LEFT
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-cyan-400 p-3.5 flex justify-between items-center">
          <div>
            <div className="text-xs font-black text-cyan-300 uppercase">HUNTER CONQUEST</div>
            <div className="text-xs text-slate-300">Target: 50 Qualified Leads</div>
          </div>
          <div className="bg-cyan-400 text-black font-black text-xs px-2 py-1 border border-black">
            IN PROGRESS
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-emerald-400 p-3.5 flex justify-between items-center">
          <div>
            <div className="text-xs font-black text-emerald-400 uppercase">GUILD CHALLENGE</div>
            <div className="text-xs text-slate-300">Target: 7-Day Quest Streak</div>
          </div>
          <div className="bg-emerald-400 text-black font-black text-xs px-2 py-1 border border-black">
            ACTIVE 🔥
          </div>
        </div>
      </div>
    </div>
  )
}
