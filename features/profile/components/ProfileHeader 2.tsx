import { Shield, Flame } from 'lucide-react'

type ProfileHeaderProps = {
  user: { name: string; title: string; level: number }
  initials: string
}

export function ProfileHeader({ user, initials }: ProfileHeaderProps) {
  return (
    <div className="bg-[#ffd200] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 z-10 relative">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-cyan-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-3xl font-black shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-black text-white px-3 py-0.5 text-xs font-black uppercase tracking-widest border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                LVL {user.level || 10}
              </span>
              <span className="bg-red-500 text-white px-3 py-0.5 text-xs font-black uppercase border border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Flame className="w-3.5 h-3.5 fill-current" /> 7-DAY STREAK
              </span>
              <span className="bg-white text-black px-2.5 py-0.5 text-xs font-black uppercase border border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> GUILD CREST
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">{user.name}</h1>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <span>Dragon Slayer 🐉</span>
              <span>|</span>
              <span>{user.title || 'Master Hunter'}</span>
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center min-w-[110px]">
            <div className="text-xs font-black text-slate-500 uppercase">MANA</div>
            <div className="text-2xl font-black text-blue-600">100/100</div>
          </div>
          <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center min-w-[110px]">
            <div className="text-xs font-black text-slate-500 uppercase">LEADS</div>
            <div className="text-2xl font-black text-emerald-600">1,402</div>
          </div>
          <div className="bg-black text-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center min-w-[110px]">
            <div className="text-xs font-black text-yellow-400 uppercase">XP RANKS</div>
            <div className="text-2xl font-black text-yellow-300">#4 GLOBAL</div>
          </div>
        </div>
      </div>
    </div>
  )
}
